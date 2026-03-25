"""Employee service."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.shared.models.employee import Employee
from app.modules.fleet.models.vehicle import Vehicle
from app.shared.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.shared.services.base import BaseService


class EmployeeService(BaseService[Employee, EmployeeCreate, EmployeeUpdate]):
    """Employee service with specialized operations."""

    def __init__(self):
        super().__init__(Employee)

    def get_by_employee_id(
        self,
        db: Session,
        employee_id: str,
        organization_id: str,
    ) -> Employee | None:
        """Get employee by employee ID within an organization."""
        result = db.execute(
            select(Employee).where(
                Employee.employee_id == employee_id,
                Employee.organization_id == organization_id,
                Employee.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def get_by_license(
        self,
        db: Session,
        license_number: str,
        organization_id: str,
    ) -> Employee | None:
        """Get employee by license number within an organization."""
        result = db.execute(
            select(Employee).where(
                Employee.license_number == license_number,
                Employee.organization_id == organization_id,
                Employee.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: EmployeeCreate,
    ) -> Employee:
        """Create a new employee with unique constraint validation."""
        existing_emp = self.get_by_employee_id(
            db,
            employee_id=obj_in.employee_id,
            organization_id=obj_in.organization_id,
        )
        if existing_emp:
            raise ConflictError(
                message="Employee with this employee ID already exists",
                details={"employee_id": obj_in.employee_id},
            )

        existing_license = self.get_by_license(
            db,
            license_number=obj_in.license_number,
            organization_id=obj_in.organization_id,
        )
        if existing_license:
            raise ConflictError(
                message="Employee with this license number already exists",
                details={"license_number": obj_in.license_number},
            )

        employee = super().create(db, obj_in=obj_in)

        if employee.assigned_vehicle_id:
            self._sync_vehicle_assignment(db, employee, employee.assigned_vehicle_id)

        return employee

    def update(
        self,
        db: Session,
        *,
        db_obj: Employee,
        obj_in: EmployeeUpdate | dict[str, Any],
    ) -> Employee:
        """Update an employee with bidirectional vehicle assignment sync."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        old_vehicle_id = db_obj.assigned_vehicle_id
        new_vehicle_id = update_data.get("assigned_vehicle_id")

        vehicle_changed = "assigned_vehicle_id" in update_data and old_vehicle_id != new_vehicle_id

        employee = super().update(db, db_obj=db_obj, obj_in=update_data)

        if vehicle_changed:
            if old_vehicle_id:
                old_vehicle = db.execute(
                    select(Vehicle).where(Vehicle.id == old_vehicle_id)
                ).scalar_one_or_none()
                if old_vehicle and old_vehicle.assigned_employee_id == employee.id:
                    old_vehicle.assigned_employee_id = None
                    db.add(old_vehicle)

            if new_vehicle_id:
                self._sync_vehicle_assignment(db, employee, new_vehicle_id)

            db.flush()

        return employee

    def _sync_vehicle_assignment(
        self,
        db: Session,
        employee: Employee,
        vehicle_id: str,
    ) -> None:
        """Sync the vehicle's assigned_employee_id to match the employee's assignment."""
        vehicle = db.execute(
            select(Vehicle).where(Vehicle.id == vehicle_id)
        ).scalar_one_or_none()

        if vehicle:
            if vehicle.assigned_employee_id and vehicle.assigned_employee_id != employee.id:
                old_employee = db.execute(
                    select(Employee).where(Employee.id == vehicle.assigned_employee_id)
                ).scalar_one_or_none()
                if old_employee:
                    old_employee.assigned_vehicle_id = None
                    db.add(old_employee)

            vehicle.assigned_employee_id = employee.id
            db.add(vehicle)
            db.flush()

    def get_available_employees(
        self,
        db: Session,
        organization_id: str,
    ) -> list[Employee]:
        """Get employees available for assignment (no assigned vehicle)."""
        result = db.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.assigned_vehicle_id.is_(None),
                Employee.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def get_by_assigned_vehicle(
        self,
        db: Session,
        vehicle_id: str,
        organization_id: str,
    ) -> Employee | None:
        """Get employee by their assigned vehicle ID."""
        result = db.execute(
            select(Employee).where(
                Employee.assigned_vehicle_id == vehicle_id,
                Employee.organization_id == organization_id,
                Employee.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def sync_all_assignments(
        self,
        db: Session,
        organization_id: str,
    ) -> int:
        """Sync all employee-vehicle assignments in both directions."""
        synced_count = 0

        employees_with_vehicles = db.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.assigned_vehicle_id.isnot(None),
                Employee.deleted_at.is_(None),
            )
        ).scalars().all()

        for employee in employees_with_vehicles:
            vehicle = db.execute(
                select(Vehicle).where(Vehicle.id == employee.assigned_vehicle_id)
            ).scalar_one_or_none()

            if vehicle and vehicle.assigned_employee_id != employee.id:
                other_employees = db.execute(
                    select(Employee).where(
                        Employee.assigned_vehicle_id == vehicle.id,
                        Employee.id != employee.id,
                        Employee.organization_id == organization_id,
                        Employee.deleted_at.is_(None),
                    )
                ).scalars().all()
                for other_employee in other_employees:
                    other_employee.assigned_vehicle_id = None
                    db.add(other_employee)

                vehicle.assigned_employee_id = employee.id
                db.add(vehicle)
                synced_count += 1

        vehicles_with_employees = db.execute(
            select(Vehicle).where(
                Vehicle.organization_id == organization_id,
                Vehicle.assigned_employee_id.isnot(None),
                Vehicle.deleted_at.is_(None),
            )
        ).scalars().all()

        for vehicle in vehicles_with_employees:
            employee = db.execute(
                select(Employee).where(Employee.id == vehicle.assigned_employee_id)
            ).scalar_one_or_none()

            if employee and employee.assigned_vehicle_id != vehicle.id:
                other_vehicles = db.execute(
                    select(Vehicle).where(
                        Vehicle.assigned_employee_id == employee.id,
                        Vehicle.id != vehicle.id,
                        Vehicle.organization_id == organization_id,
                        Vehicle.deleted_at.is_(None),
                    )
                ).scalars().all()
                for other_vehicle in other_vehicles:
                    other_vehicle.assigned_employee_id = None
                    db.add(other_vehicle)

                employee.assigned_vehicle_id = vehicle.id
                db.add(employee)
                synced_count += 1

        db.flush()
        return synced_count

    def get_employees_by_status(
        self,
        db: Session,
        organization_id: str,
        status: str,
    ) -> list[Employee]:
        """Get employees by status."""
        from app.shared.models.enums import EmployeeStatus

        status_enum = EmployeeStatus(status)
        result = db.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.status == status_enum,
                Employee.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def get_employees_with_expiring_licenses(
        self,
        db: Session,
        organization_id: str,
        days: int = 30,
    ) -> list[Employee]:
        """Get employees with licenses expiring within specified days."""
        from datetime import date, timedelta

        expiry_threshold = date.today() + timedelta(days=days)
        result = db.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.license_expiry <= expiry_threshold,
                Employee.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def set_pin(
        self,
        db: Session,
        employee: Employee,
        pin_code: str,
    ) -> Employee:
        """Set employee PIN code for POS access."""
        employee.pin_code = pin_code
        db.add(employee)
        db.flush()
        db.refresh(employee)
        return employee


employee_service = EmployeeService()
