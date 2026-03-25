"""Add notification_preferences table.

Revision ID: 9d4f6e8a2b1c
Revises: 8b3e5f7a9c1d
Create Date: 2025-12-15 00:00:02.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9d4f6e8a2b1c"
down_revision: str | None = "8b3e5f7a9c1d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create notification_preferences table."""
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=False), nullable=False),
        # Channel settings
        sa.Column("email_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("push_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sms_enabled", sa.Boolean(), nullable=False, server_default="false"),
        # Contact info
        sa.Column("email_address", sa.String(255), nullable=True),
        sa.Column("phone_number", sa.String(50), nullable=True),
        # Quiet hours
        sa.Column("quiet_hours_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("quiet_hours_start", sa.String(5), nullable=True, server_default="22:00"),
        sa.Column("quiet_hours_end", sa.String(5), nullable=True, server_default="07:00"),
        # Per-notification settings as JSONB
        sa.Column("notification_settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Constraints
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )

    # Create index on user_id for faster lookups
    op.create_index(
        "ix_notification_preferences_user_id",
        "notification_preferences",
        ["user_id"],
        unique=True,
    )


def downgrade() -> None:
    """Drop notification_preferences table."""
    op.drop_index("ix_notification_preferences_user_id", table_name="notification_preferences")
    op.drop_table("notification_preferences")
