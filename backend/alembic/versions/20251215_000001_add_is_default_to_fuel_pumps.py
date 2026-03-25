"""Add is_default field to fuel_pumps table.

Revision ID: 8b3e5f7a9c1d
Revises: 7cacf49b257f
Create Date: 2025-12-15 00:00:01.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8b3e5f7a9c1d"
down_revision: str | None = "7cacf49b257f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add is_default column to fuel_pumps table."""
    op.add_column(
        "fuel_pumps",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    """Remove is_default column from fuel_pumps table."""
    op.drop_column("fuel_pumps", "is_default")
