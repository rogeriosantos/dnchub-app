"""Fix fueltype enum values to lowercase

Revision ID: 0d964f7dc85d
Revises: 5fa7c6ca7595
Create Date: 2025-12-14 11:41:41.813312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d964f7dc85d'
down_revision: Union[str, None] = '5fa7c6ca7595'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename fueltype enum values from UPPERCASE to lowercase
    # PostgreSQL 10+ supports RENAME VALUE
    op.execute("ALTER TYPE fueltype RENAME VALUE 'DIESEL' TO 'diesel'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'PETROL' TO 'petrol'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'GASOLINE' TO 'gasoline'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'ELECTRIC' TO 'electric'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'HYBRID' TO 'hybrid'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'LPG' TO 'lpg'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'CNG' TO 'cng'")


def downgrade() -> None:
    # Rename fueltype enum values back to UPPERCASE
    op.execute("ALTER TYPE fueltype RENAME VALUE 'diesel' TO 'DIESEL'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'petrol' TO 'PETROL'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'gasoline' TO 'GASOLINE'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'electric' TO 'ELECTRIC'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'hybrid' TO 'HYBRID'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'lpg' TO 'LPG'")
    op.execute("ALTER TYPE fueltype RENAME VALUE 'cng' TO 'CNG'")
