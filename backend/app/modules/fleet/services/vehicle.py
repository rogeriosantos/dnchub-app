"""Vehicle service."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.models import Employee, Vehicle, VehicleGroup, VehicleGroupMember, VehicleStatus
from app.schemas import VehicleCreate, VehicleGroupCreate, VehicleGroupUpdate, VehicleUpdate
from app.shared.services.base import BaseService


class VehicleService(BaseService[Vehicle, VehicleCreate, VehicleUpdate]):
    """Vehicle service with specialized operations."""

    def __init__(self):
        super().__init__(Vehicle)

    def get_by_plate(
        self,
        db: Session,
        registration_plate: str,
        organization_id: str,
    ) -> Vehicle | None:
        """Get vehicle by registration plate within an organization."""
        result = db.execute(
            select(Vehicle).where(
                Vehicle.registration_plate == registration_plate,
                Vehicle.organization_id == organization_id,
                Vehicle.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: VehicleCreate,
    ) -> Vehicle:
        """Create a new vehicle with unique plate validation."""
        # Check for existing vehicle with same plate
        existing = self.get_by_plate(
            db,
            registration_plate=obj_in.registration_plate,
            organization_id=obj_in.organization_id,
        )
        if existing:
            raise ConflictError(
                message="Vehicle with this registration plate already exists",
                details={"registration_plate": obj_in.registration_plate},
            )

        # Create the vehicle
        vehicle = super().create(db, obj_in=obj_in)

        # Sync employee assignment if assigned_employee_id is provided
        if vehicle.assigned_employee_id:
            self._sync_employee_assignment(db, vehicle, vehicle.assigned_employee_id)

        return vehicle

    def update(
        self,
        db: Session,
        *,
        db_obj: Vehicle,
        obj_in: VehicleUpdate | dict[str, Any],
    ) -> Vehicle:
        """Update a vehicle with bidirectional employee assignment sync."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        old_employee_id = db_obj.assigned_employee_id
        new_employee_id = update_data.get("assigned_employee_id")

        # Check if employee assignment is changing
        employee_changed = "assigned_employee_id" in update_data and old_employee_id != new_employee_id

        # Perform the update
        vehicle = super().update(db, db_obj=db_obj, obj_in=update_data)

        # Sync employee assignment if it changed
        if employee_changed:
            # Clear old employee's vehicle assignment
            if old_employee_id:
                old_employee = db.execute(
                    select(Employee).where(Employee.id == old_employee_id)
                ).scalar_one_or_none()
                if old_employee and old_employee.assigned_vehicle_id == vehicle.id:
                    old_employee.assigned_vehicle_id = None
                    db.add(old_employee)

            # Set new employee's vehicle assignment
            if new_employee_id:
                self._sync_employee_assignment(db, vehicle, new_employee_id)

            db.flush()

        return vehicle

    def _sync_employee_assignment(
        self,
        db: Session,
        vehicle: Vehicle,
        employee_id: str,
    ) -> None:
        """Sync the employee's assigned_vehicle_id to match the vehicle's assignment."""
        employee = db.execute(
            select(Employee).where(Employee.id == employee_id)
        ).scalar_one_or_none()

        if employee:
            # If employee was assigned to another vehicle, clear that vehicle's assignment
            if employee.assigned_vehicle_id and employee.assigned_vehicle_id != vehicle.id:
                old_vehicle = db.execute(
                    select(Vehicle).where(Vehicle.id == employee.assigned_vehicle_id)
                ).scalar_one_or_none()
                if old_vehicle:
                    old_vehicle.assigned_employee_id = None
                    db.add(old_vehicle)

            # Set this employee's assigned vehicle
            employee.assigned_vehicle_id = vehicle.id
            db.add(employee)
            db.flush()

    def get_by_status(
        self,
        db: Session,
        organization_id: str,
        status: VehicleStatus,
    ) -> list[Vehicle]:
        """Get vehicles by status."""
        result = db.execute(
            select(Vehicle).where(
                Vehicle.organization_id == organization_id,
                Vehicle.status == status,
                Vehicle.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def get_available_for_assignment(
        self,
        db: Session,
        organization_id: str,
    ) -> list[Vehicle]:
        """Get vehicles available for assignment."""
        result = db.execute(
            select(Vehicle).where(
                Vehicle.organization_id == organization_id,
                Vehicle.status == VehicleStatus.ACTIVE,
                Vehicle.assigned_employee_id.is_(None),
                Vehicle.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def update_odometer(
        self,
        db: Session,
        vehicle: Vehicle,
        new_odometer: float,
    ) -> Vehicle:
        """Update vehicle odometer (only allows increase)."""
        from decimal import Decimal

        new_odometer_decimal = Decimal(str(new_odometer))
        if new_odometer_decimal < vehicle.current_odometer:
            from app.core.exceptions import ValidationError

            raise ValidationError(
                message="New odometer reading cannot be less than current reading",
                details={
                    "current_odometer": str(vehicle.current_odometer),
                    "new_odometer": str(new_odometer_decimal),
                },
            )

        vehicle.current_odometer = new_odometer_decimal
        db.add(vehicle)
        db.flush()
        db.refresh(vehicle)
        return vehicle


class VehicleGroupService(BaseService[VehicleGroup, VehicleGroupCreate, VehicleGroupUpdate]):
    """Vehicle group service."""

    def __init__(self):
        super().__init__(VehicleGroup)

    def create(
        self,
        db: Session,
        *,
        obj_in: VehicleGroupCreate,
    ) -> VehicleGroup:
        """Create a vehicle group with members."""
        group_data = obj_in.model_dump(exclude={"vehicle_ids"})
        db_obj = VehicleGroup(**group_data)
        db.add(db_obj)
        db.flush()

        # Add vehicles to group
        if obj_in.vehicle_ids:
            for vehicle_id in obj_in.vehicle_ids:
                member = VehicleGroupMember(
                    vehicle_group_id=db_obj.id,
                    vehicle_id=vehicle_id,
                )
                db.add(member)

        db.flush()
        db.refresh(db_obj)
        return db_obj

    def add_vehicle(
        self,
        db: Session,
        group_id: str,
        vehicle_id: str,
    ) -> VehicleGroupMember:
        """Add a vehicle to a group."""
        # Check if already member
        result = db.execute(
            select(VehicleGroupMember).where(
                VehicleGroupMember.vehicle_group_id == group_id,
                VehicleGroupMember.vehicle_id == vehicle_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        member = VehicleGroupMember(
            vehicle_group_id=group_id,
            vehicle_id=vehicle_id,
        )
        db.add(member)
        db.flush()
        db.refresh(member)
        return member

    def remove_vehicle(
        self,
        db: Session,
        group_id: str,
        vehicle_id: str,
    ) -> bool:
        """Remove a vehicle from a group."""
        result = db.execute(
            select(VehicleGroupMember).where(
                VehicleGroupMember.vehicle_group_id == group_id,
                VehicleGroupMember.vehicle_id == vehicle_id,
            )
        )
        member = result.scalar_one_or_none()
        if member:
            db.delete(member)
            db.flush()
            return True
        return False


vehicle_service = VehicleService()
vehicle_group_service = VehicleGroupService()
