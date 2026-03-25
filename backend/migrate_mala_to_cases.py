"""Migration script: Move MALA tools to tool_cases table.

Usage:
    # Dry run (default) - shows what WOULD happen without changing anything
    uv run python migrate_mala_to_cases.py

    # Execute the migration
    uv run python migrate_mala_to_cases.py --execute
"""

import sys
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

# Must import ALL models so SQLAlchemy can resolve all cross-model relationships
import app.models  # noqa: F401 - registers all models with the ORM mapper
from app.db.base import SessionLocal
from app.modules.tools.models.tool import Tool
from app.modules.tools.models.tool_case import ToolCase

# Additional tools (not starting with "MALA") that are confirmed to BE cases.
# Identified manually from Group 2 review.
ADDITIONAL_CASE_ERP_CODES = {
    "FRT000067",  # "BASE MAGNETICA com fita metrica" - desc: "MALA BASE MAGNETICA"
    "FRT000359",  # "Adaptador OTT HSK A50" - desc: "Ferramenta, mala OTT"
    "FRT000644",  # "Adaptador OTT HSK A25" - desc: "Ferramenta, mala OTT" (same pattern as FRT000359)
}


def find_case_tools(db: Session) -> list[Tool]:
    """Tools that ARE cases: name starts with MALA, OR are in the additional confirmed list."""
    return (
        db.query(Tool)
        .filter(
            (func.upper(Tool.name).like("MALA%") | Tool.erp_code.in_(ADDITIONAL_CASE_ERP_CODES)),
            Tool.deleted_at.is_(None),
        )
        .order_by(Tool.erp_code)
        .all()
    )


def find_remaining_review_tools(db: Session) -> list[Tool]:
    """Tools with 'mala' in description that are NOT being migrated — for final reporting."""
    return (
        db.query(Tool)
        .filter(
            func.upper(Tool.description).like("%MALA%"),
            ~func.upper(Tool.name).like("MALA%"),
            ~Tool.erp_code.in_(ADDITIONAL_CASE_ERP_CODES),
            Tool.deleted_at.is_(None),
        )
        .order_by(Tool.erp_code)
        .all()
    )


def case_already_exists(db: Session, organization_id: str, erp_code: str) -> ToolCase | None:
    return (
        db.query(ToolCase)
        .filter(
            ToolCase.organization_id == organization_id,
            ToolCase.erp_code == erp_code,
            ToolCase.deleted_at.is_(None),
        )
        .first()
    )


def process_tool_as_case(db: Session, tool: Tool, now: datetime, dry_run: bool) -> str:
    """Create a tool_case record from a tool and soft-delete the tool. Returns action taken."""
    existing = case_already_exists(db, tool.organization_id, tool.erp_code)
    if existing:
        return "SKIP"

    if not dry_run:
        new_case = ToolCase(
            organization_id=tool.organization_id,
            erp_code=tool.erp_code,
            name=tool.name,
            description=tool.description,
            status=tool.status,
            condition=tool.condition,
            images=tool.images,
            notes=tool.notes,
            location_id=tool.location_id,
        )
        db.add(new_case)
        db.flush()
        tool.deleted_at = now

    return "MIGRATE"


def migrate(db: Session, dry_run: bool = True) -> None:
    now = datetime.now(timezone.utc)

    case_tools = find_case_tools(db)
    review_tools = find_remaining_review_tools(db)

    print(f"\n{'[DRY RUN] ' if dry_run else ''}MALA MIGRATION REPORT")
    print("=" * 60)
    print(f"\nGroup 1 - Tools to migrate ({len(case_tools)} records)")
    print("-" * 60)

    migrated = 0
    skipped = 0

    for tool in case_tools:
        action = process_tool_as_case(db, tool, now, dry_run)
        tag = "SKIP (exists)" if action == "SKIP" else "MIGRATE      "
        flag = " [+extra]" if tool.erp_code in ADDITIONAL_CASE_ERP_CODES else ""
        print(f"  {tag} | {tool.erp_code:15s} | {tool.name}{flag}")
        if action == "SKIP":
            skipped += 1
        else:
            migrated += 1

    print(f"\nGroup 2 - Remaining manual review ({len(review_tools)} records)")
    print("   These are NOT migrated - likely tools that came WITH a case.")
    print("-" * 60)
    for tool in review_tools:
        print(f"  REVIEW | {tool.erp_code:15s} | {tool.name}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Migrated      : {migrated}")
    print(f"  Already exists: {skipped}")
    print(f"  Manual review : {len(review_tools)}")
    if dry_run:
        print("\n  -> DRY RUN - no changes made.")
        print("  -> Run with --execute to apply the migration.")
    else:
        print("\n  -> EXECUTED - changes committed to database.")


def main() -> None:
    execute = "--execute" in sys.argv
    dry_run = not execute

    db = SessionLocal()
    try:
        migrate(db, dry_run=dry_run)
        if not dry_run:
            db.commit()
            print("  [OK] Transaction committed.")
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
