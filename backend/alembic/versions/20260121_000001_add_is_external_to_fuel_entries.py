"""Add is_external to fuel_entries table.

Revision ID: c8d9e0f1a2b3
Revises: b7e9f2a3c4d5
Create Date: 2026-01-21 00:00:01.000000

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c8d9e0f1a2b3"
down_revision: str | None = "b7e9f2a3c4d5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add is_external column to fuel_entries table
    op.add_column(
        "fuel_entries",
        sa.Column("is_external", sa.Boolean(), nullable=False, server_default="false"),
    )
    # Remove the server_default after adding the column
    op.alter_column("fuel_entries", "is_external", server_default=None)


def downgrade() -> None:
    op.drop_column("fuel_entries", "is_external")
