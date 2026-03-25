"""Add is_backoffice field to drivers table.

Revision ID: b7e9f2a3c4d5
Revises: 9d4f6e8a2b1c
Create Date: 2026-01-12 00:00:01.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7e9f2a3c4d5"
down_revision: str | None = "9d4f6e8a2b1c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add is_backoffice column to drivers table."""
    op.add_column(
        "drivers",
        sa.Column("is_backoffice", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    """Remove is_backoffice column from drivers table."""
    op.drop_column("drivers", "is_backoffice")
