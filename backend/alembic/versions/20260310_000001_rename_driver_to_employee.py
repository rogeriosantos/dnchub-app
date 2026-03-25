"""Rename driver to employee and DRIVER role to TECHNICIAN.

Revision ID: f3e2d1c0b9a8
Revises: c8d9e0f1a2b3
Create Date: 2026-03-10

This migration:
1. Renames 'drivers' table to 'employees'
2. Renames 'assigned_driver_id' column to 'assigned_employee_id' on vehicles
3. Renames 'driver_id' column to 'employee_id' on fuel_entries, trips, tickets
4. Updates userrole enum: 'driver' -> 'technician' (recreate enum approach)
5. Updates entitytype enum: 'driver' -> 'employee' (recreate enum approach)
6. Renames driverstatus enum to employeestatus
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "f3e2d1c0b9a8"
down_revision = "c8d9e0f1a2b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- 1. Rename the drivers table to employees ---
    op.rename_table("drivers", "employees")

    # --- 2. Rename columns that reference drivers ---
    op.alter_column("vehicles", "assigned_driver_id", new_column_name="assigned_employee_id")
    op.alter_column("fuel_entries", "driver_id", new_column_name="employee_id")
    op.alter_column("trips", "driver_id", new_column_name="employee_id")
    op.alter_column("tickets", "driver_id", new_column_name="employee_id")

    # --- 3. Update userrole enum: replace 'driver' with 'technician' ---
    # PostgreSQL can't use new enum values in the same transaction,
    # so we recreate the enum type with the correct values.
    op.execute("ALTER TYPE userrole RENAME TO userrole_old")
    op.execute(
        "CREATE TYPE userrole AS ENUM "
        "('admin', 'fleet_manager', 'operator', 'viewer', 'technician')"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE userrole "
        "USING CASE WHEN role::text = 'driver' THEN 'technician'::userrole "
        "ELSE role::text::userrole END"
    )
    op.execute("DROP TYPE userrole_old")

    # --- 4. Update entitytype enum: replace 'driver' with 'employee' ---
    op.execute("ALTER TYPE entitytype RENAME TO entitytype_old")
    op.execute(
        "CREATE TYPE entitytype AS ENUM "
        "('vehicle', 'employee', 'organization')"
    )
    op.execute(
        "ALTER TABLE documents ALTER COLUMN entity_type TYPE entitytype "
        "USING CASE WHEN entity_type::text = 'driver' THEN 'employee'::entitytype "
        "ELSE entity_type::text::entitytype END"
    )
    op.execute("DROP TYPE entitytype_old")

    # --- 5. Rename driverstatus enum to employeestatus ---
    op.execute("ALTER TYPE driverstatus RENAME TO employeestatus")


def downgrade() -> None:
    # --- 5. Rename employeestatus back to driverstatus ---
    op.execute("ALTER TYPE employeestatus RENAME TO driverstatus")

    # --- 4. Revert entitytype enum ---
    op.execute("ALTER TYPE entitytype RENAME TO entitytype_old")
    op.execute(
        "CREATE TYPE entitytype AS ENUM "
        "('vehicle', 'driver', 'organization')"
    )
    op.execute(
        "ALTER TABLE documents ALTER COLUMN entity_type TYPE entitytype "
        "USING CASE WHEN entity_type::text = 'employee' THEN 'driver'::entitytype "
        "ELSE entity_type::text::entitytype END"
    )
    op.execute("DROP TYPE entitytype_old")

    # --- 3. Revert userrole enum ---
    op.execute("ALTER TYPE userrole RENAME TO userrole_old")
    op.execute(
        "CREATE TYPE userrole AS ENUM "
        "('admin', 'fleet_manager', 'operator', 'viewer', 'driver')"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE userrole "
        "USING CASE WHEN role::text = 'technician' THEN 'driver'::userrole "
        "ELSE role::text::userrole END"
    )
    op.execute("DROP TYPE userrole_old")

    # --- 2. Rename columns back ---
    op.alter_column("tickets", "employee_id", new_column_name="driver_id")
    op.alter_column("trips", "employee_id", new_column_name="driver_id")
    op.alter_column("fuel_entries", "employee_id", new_column_name="driver_id")
    op.alter_column("vehicles", "assigned_employee_id", new_column_name="assigned_driver_id")

    # --- 1. Rename employees table back to drivers ---
    op.rename_table("employees", "drivers")
