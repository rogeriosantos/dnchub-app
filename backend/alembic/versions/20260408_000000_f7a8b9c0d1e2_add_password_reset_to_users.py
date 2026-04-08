"""add_password_reset_to_users

Revision ID: f7a8b9c0d1e2
Revises: 39ae89ae2feb
Create Date: 2026-04-08 00:00:01.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, None] = '39ae89ae2feb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column(
        'password_reset_token', sa.String(length=255), nullable=True
    ))
    op.add_column('users', sa.Column(
        'password_reset_expires', sa.DateTime(timezone=True), nullable=True
    ))


def downgrade() -> None:
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
