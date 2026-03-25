"""Add appearance settings to users

Revision ID: 7cacf49b257f
Revises: dad97592d91c
Create Date: 2025-12-14 18:15:10.166672

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7cacf49b257f'
down_revision: Union[str, None] = 'dad97592d91c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types first
    theme_enum = sa.Enum('light', 'dark', 'system', name='themepreference')
    theme_enum.create(op.get_bind(), checkfirst=True)

    dateformat_enum = sa.Enum('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', name='dateformatpreference')
    dateformat_enum.create(op.get_bind(), checkfirst=True)

    # Add columns with server defaults for existing rows
    op.add_column('users', sa.Column('theme_preference',
        sa.Enum('light', 'dark', 'system', name='themepreference'),
        nullable=False, server_default='system'))
    op.add_column('users', sa.Column('language',
        sa.String(length=10), nullable=False, server_default='en'))
    op.add_column('users', sa.Column('date_format',
        sa.Enum('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', name='dateformatpreference'),
        nullable=False, server_default='MM/DD/YYYY'))


def downgrade() -> None:
    op.drop_column('users', 'date_format')
    op.drop_column('users', 'language')
    op.drop_column('users', 'theme_preference')

    # Drop enum types
    sa.Enum(name='themepreference').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='dateformatpreference').drop(op.get_bind(), checkfirst=True)
