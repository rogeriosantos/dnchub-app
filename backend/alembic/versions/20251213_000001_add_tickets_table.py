"""Add tickets table

Revision ID: a1b2c3d4e5f6
Revises: 2be4e79def67
Create Date: 2025-12-13 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '2be4e79def67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE tickettype AS ENUM ('speed', 'parking', 'toll', 'red_light', 'other')")
    op.execute("CREATE TYPE ticketstatus AS ENUM ('pending', 'paid', 'appealed', 'cancelled', 'overdue')")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')")

    # Create tickets table
    op.create_table('tickets',
        sa.Column('organization_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('vehicle_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('driver_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('ticket_number', sa.String(length=100), nullable=True),
        sa.Column('type', postgresql.ENUM('speed', 'parking', 'toll', 'red_light', 'other', name='tickettype', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'paid', 'appealed', 'cancelled', 'overdue', name='ticketstatus', create_type=False), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('violation_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('violation_location', sa.String(length=500), nullable=True),
        sa.Column('issuing_authority', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('paid_date', sa.Date(), nullable=True),
        sa.Column('paid_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('payment_method', postgresql.ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other', name='paymentmethod', create_type=False), nullable=True),
        sa.Column('payment_reference', sa.String(length=255), nullable=True),
        sa.Column('points_deducted', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('attachment_url', sa.String(length=500), nullable=True),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_tickets_organization_id', 'tickets', ['organization_id'])
    op.create_index('ix_tickets_vehicle_id', 'tickets', ['vehicle_id'])
    op.create_index('ix_tickets_driver_id', 'tickets', ['driver_id'])
    op.create_index('ix_tickets_status', 'tickets', ['status'])
    op.create_index('ix_tickets_type', 'tickets', ['type'])
    op.create_index('ix_tickets_violation_date', 'tickets', ['violation_date'])
    op.create_index('ix_tickets_due_date', 'tickets', ['due_date'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_tickets_due_date', table_name='tickets')
    op.drop_index('ix_tickets_violation_date', table_name='tickets')
    op.drop_index('ix_tickets_type', table_name='tickets')
    op.drop_index('ix_tickets_status', table_name='tickets')
    op.drop_index('ix_tickets_driver_id', table_name='tickets')
    op.drop_index('ix_tickets_vehicle_id', table_name='tickets')
    op.drop_index('ix_tickets_organization_id', table_name='tickets')

    # Drop table
    op.drop_table('tickets')

    # Drop enum types
    op.execute("DROP TYPE paymentmethod")
    op.execute("DROP TYPE ticketstatus")
    op.execute("DROP TYPE tickettype")
