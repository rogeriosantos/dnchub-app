"""Authentication endpoints."""

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.shared.api.deps import DBDep
from app.core.config import settings
from app.models import Employee, Vehicle, FuelPump, FuelEntry, FuelPumpDelivery
from app.models.enums import FuelType
from app.schemas import (
    EmployeePinChangeRequest,
    EmployeePinChangeResponse,
    EmployeePinLoginRequest,
    EmployeePinResetRequest,
    EmployeePinResetResponse,
    LoginRequest,
    MessagingChannelsResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services import auth_service


class POSEmployeeInfo(BaseModel):
    """Minimal employee info for POS login screen."""

    id: str
    employee_id: str
    first_name: str
    last_name: str
    status: str
    is_backoffice: bool = False


class POSVehicleInfo(BaseModel):
    """Vehicle info for POS."""

    id: str
    registration_plate: str
    make: str
    model: str
    year: int
    fuel_type: str
    current_odometer: float
    status: str


class POSPumpInfo(BaseModel):
    """Fuel pump info for POS."""

    id: str
    name: str
    code: str
    fuel_type: str
    status: str
    capacity: float
    current_level: float
    current_odometer: float
    level_percentage: float
    is_default: bool


class POSFuelEntryCreate(BaseModel):
    """Create fuel entry from POS."""

    employee_id: str
    vehicle_id: str
    odometer: float = Field(..., gt=0)
    volume: float = Field(..., gt=0)
    notes: Optional[str] = None
    date: Optional[str] = None  # ISO date string for backdating (backoffice only)

    # Internal pump fields (required for internal, optional for external)
    pump_id: Optional[str] = None
    pump_odometer: Optional[float] = None

    # External station fields
    is_external: bool = False
    station_name: Optional[str] = None  # e.g., "BP", "Shell", "Galp"
    station_address: Optional[str] = None
    price_per_unit: Optional[float] = None  # Price per liter
    total_cost: Optional[float] = None  # Total cost (can be calculated or entered)
    receipt_image: Optional[str] = None  # Base64 image or URL

router = APIRouter()


@router.get("/pos-employees", response_model=list[POSEmployeeInfo])
def get_pos_employees(db: DBDep) -> list[POSEmployeeInfo]:
    """Get list of employees for POS login screen (public endpoint)."""
    result = db.execute(
        select(Employee).where(
            Employee.deleted_at.is_(None),
            Employee.status != "suspended",
        )
    )
    employees = result.scalars().all()

    return [
        POSEmployeeInfo(
            id=str(employee.id),
            employee_id=employee.employee_id,
            first_name=employee.first_name,
            last_name=employee.last_name,
            status=employee.status.value if hasattr(employee.status, "value") else employee.status,
            is_backoffice=employee.is_backoffice,
        )
        for employee in employees
    ]


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: DBDep,
) -> TokenResponse:
    """Authenticate user with email and password."""
    return auth_service.authenticate_user(db, login_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: DBDep,
) -> TokenResponse:
    """Refresh access token using refresh token."""
    return auth_service.refresh_access_token(db, refresh_data.refresh_token)


@router.post("/employee-login", response_model=TokenResponse)
def employee_login(
    login_data: EmployeePinLoginRequest,
    db: DBDep,
) -> TokenResponse:
    """Authenticate employee with employee ID and PIN (for POS)."""
    return auth_service.authenticate_employee_pin(
        db,
        employee_id=login_data.employee_id,
        pin=login_data.pin,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(
    register_data: RegisterRequest,
    db: DBDep,
) -> TokenResponse:
    """Register a new organization with admin user."""
    return auth_service.register(db, register_data)


@router.get("/messaging-channels", response_model=MessagingChannelsResponse)
def get_messaging_channels() -> MessagingChannelsResponse:
    """Get available messaging channels for PIN delivery."""
    channels = []
    if settings.email_enabled:
        channels.append("email")
    if settings.whatsapp_enabled:
        channels.append("whatsapp")

    return MessagingChannelsResponse(
        channels=channels,
        email_enabled=settings.email_enabled,
        whatsapp_enabled=settings.whatsapp_enabled,
    )


@router.post("/employee-pin-reset", response_model=EmployeePinResetResponse)
def reset_employee_pin(
    reset_data: EmployeePinResetRequest,
    db: DBDep,
) -> EmployeePinResetResponse:
    """Reset employee PIN and send via email or WhatsApp."""
    return auth_service.reset_employee_pin(
        db,
        employee_id=reset_data.employee_id,
        delivery_method=reset_data.delivery_method,
    )


@router.post("/employee-pin-change", response_model=EmployeePinChangeResponse)
def change_employee_pin(
    change_data: EmployeePinChangeRequest,
    db: DBDep,
) -> EmployeePinChangeResponse:
    """Change employee PIN after verifying current PIN."""
    return auth_service.change_employee_pin(
        db,
        employee_id=change_data.employee_id,
        current_pin=change_data.current_pin,
        new_pin=change_data.new_pin,
    )


# ============================================================================
# POS Endpoints (public, for employee fuel entry)
# ============================================================================


@router.get("/pos-vehicles/{employee_id}", response_model=list[POSVehicleInfo])
def get_pos_vehicles(
    employee_id: str,
    db: DBDep,
    all_vehicles: bool = False,
) -> list[POSVehicleInfo]:
    """Get vehicles assigned to an employee for POS (public endpoint).

    If the employee is a backoffice user (is_backoffice=True), returns ALL
    active vehicles in the same organization instead of just assigned ones.

    If all_vehicles=True, returns all vehicles in the organization regardless
    of employee assignment (for "Other Vehicle" selection).
    """
    # Verify employee exists
    employee_result = db.execute(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.deleted_at.is_(None),
        )
    )
    employee = employee_result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Backoffice employees OR all_vehicles flag - get ALL vehicles in organization
    if employee.is_backoffice or all_vehicles:
        result = db.execute(
            select(Vehicle).where(
                Vehicle.organization_id == employee.organization_id,
                Vehicle.deleted_at.is_(None),
            )
        )
    else:
        # Regular employees only see their assigned vehicles
        result = db.execute(
            select(Vehicle).where(
                Vehicle.assigned_employee_id == employee_id,
                Vehicle.deleted_at.is_(None),
            )
        )
    vehicles = result.scalars().all()

    return [
        POSVehicleInfo(
            id=str(vehicle.id),
            registration_plate=vehicle.registration_plate,
            make=vehicle.make,
            model=vehicle.model,
            year=vehicle.year,
            fuel_type=vehicle.fuel_type.value if hasattr(vehicle.fuel_type, "value") else vehicle.fuel_type,
            current_odometer=float(vehicle.current_odometer or 0),
            status=vehicle.status.value if hasattr(vehicle.status, "value") else vehicle.status,
        )
        for vehicle in vehicles
    ]


@router.get("/pos-pumps", response_model=list[POSPumpInfo])
def get_all_pos_pumps(db: DBDep) -> list[POSPumpInfo]:
    """Get all active fuel pumps for POS (public endpoint)."""
    result = db.execute(
        select(FuelPump).where(
            FuelPump.status == "active",
            FuelPump.deleted_at.is_(None),
        )
    )
    pumps = result.scalars().all()

    return [
        POSPumpInfo(
            id=str(pump.id),
            name=pump.name,
            code=pump.code,
            fuel_type=pump.fuel_type.value if hasattr(pump.fuel_type, "value") else pump.fuel_type,
            status=pump.status.value if hasattr(pump.status, "value") else pump.status,
            capacity=float(pump.capacity),
            current_level=float(pump.current_level),
            current_odometer=float(pump.current_odometer or 0),
            level_percentage=float(pump.current_level / pump.capacity * 100) if pump.capacity > 0 else 0,
            is_default=pump.is_default,
        )
        for pump in pumps
        if pump.current_level > 0  # Only show pumps with fuel
    ]


@router.get("/pos-pumps/{fuel_type}", response_model=list[POSPumpInfo])
def get_pos_pumps(fuel_type: str, db: DBDep) -> list[POSPumpInfo]:
    """Get active fuel pumps by fuel type for POS (public endpoint)."""
    # Get pumps matching fuel type
    result = db.execute(
        select(FuelPump).where(
            FuelPump.fuel_type == fuel_type,
            FuelPump.status == "active",
            FuelPump.deleted_at.is_(None),
        )
    )
    pumps = result.scalars().all()

    return [
        POSPumpInfo(
            id=str(pump.id),
            name=pump.name,
            code=pump.code,
            fuel_type=pump.fuel_type.value if hasattr(pump.fuel_type, "value") else pump.fuel_type,
            status=pump.status.value if hasattr(pump.status, "value") else pump.status,
            capacity=float(pump.capacity),
            current_level=float(pump.current_level),
            current_odometer=float(pump.current_odometer or 0),
            level_percentage=float(pump.current_level / pump.capacity * 100) if pump.capacity > 0 else 0,
            is_default=pump.is_default,
        )
        for pump in pumps
        if pump.current_level > 0  # Only show pumps with fuel
    ]


@router.post("/pos-fuel-entry", status_code=201)
def create_pos_fuel_entry(entry_data: POSFuelEntryCreate, db: DBDep) -> dict:
    """Create a fuel entry from POS (public endpoint).

    Supports both internal (in-house pump) and external (gas station) fuel entries.
    """
    from datetime import date, datetime, timezone

    # Verify employee exists
    employee_result = db.execute(
        select(Employee).where(
            Employee.id == entry_data.employee_id,
            Employee.deleted_at.is_(None),
        )
    )
    employee = employee_result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Determine entry date - backoffice employees can backdate
    if entry_data.date and employee.is_backoffice:
        try:
            entry_date = date.fromisoformat(entry_data.date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD)")
    else:
        entry_date = date.today()

    # All employees can access any vehicle in their organization
    vehicle_result = db.execute(
        select(Vehicle).where(
            Vehicle.id == entry_data.vehicle_id,
            Vehicle.organization_id == employee.organization_id,
            Vehicle.deleted_at.is_(None),
        )
    )
    vehicle = vehicle_result.scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    volume = Decimal(str(entry_data.volume))

    # Handle EXTERNAL fuel entry (gas station like BP, Shell, etc.)
    if entry_data.is_external:
        # Validate external station fields
        if not entry_data.station_name:
            raise HTTPException(status_code=400, detail="Station name is required for external entries")
        if not entry_data.price_per_unit and not entry_data.total_cost:
            raise HTTPException(status_code=400, detail="Price per unit or total cost is required for external entries")

        # Calculate pricing
        if entry_data.price_per_unit:
            price_per_unit = Decimal(str(entry_data.price_per_unit))
            total_cost = volume * price_per_unit if not entry_data.total_cost else Decimal(str(entry_data.total_cost))
        else:
            total_cost = Decimal(str(entry_data.total_cost))
            price_per_unit = total_cost / volume if volume > 0 else Decimal("0")

        # Create external fuel entry
        fuel_entry = FuelEntry(
            organization_id=employee.organization_id,
            vehicle_id=entry_data.vehicle_id,
            employee_id=entry_data.employee_id,
            pump_id=None,  # No pump for external
            date=entry_date,
            time=datetime.now(timezone.utc).time(),
            odometer=Decimal(str(entry_data.odometer)),
            volume=volume,
            fuel_type=vehicle.fuel_type,
            price_per_unit=price_per_unit,
            total_cost=total_cost,
            station=entry_data.station_name,
            station_address=entry_data.station_address,
            receipt_image=entry_data.receipt_image,
            is_external=True,
            full_tank=True,
            notes=entry_data.notes,
        )
        db.add(fuel_entry)

        # Update vehicle odometer
        vehicle.current_odometer = Decimal(str(entry_data.odometer))
        db.add(vehicle)

        db.commit()
        return {"success": True, "message": "External fuel entry created successfully"}

    # Handle INTERNAL fuel entry (in-house pump)
    else:
        # Validate internal pump fields
        if not entry_data.pump_id:
            raise HTTPException(status_code=400, detail="Pump ID is required for internal entries")
        if not entry_data.pump_odometer:
            raise HTTPException(status_code=400, detail="Pump odometer is required for internal entries")

        # Verify pump exists and has enough fuel
        pump_result = db.execute(
            select(FuelPump).where(
                FuelPump.id == entry_data.pump_id,
                FuelPump.deleted_at.is_(None),
            )
        )
        pump = pump_result.scalar_one_or_none()
        if pump is None:
            raise HTTPException(status_code=404, detail="Pump not found")
        if pump.current_level < entry_data.volume:
            raise HTTPException(status_code=400, detail="Not enough fuel in pump")

        # Get latest delivery price for the pump
        delivery_result = db.execute(
            select(FuelPumpDelivery)
            .where(
                FuelPumpDelivery.pump_id == entry_data.pump_id,
                FuelPumpDelivery.deleted_at.is_(None),
            )
            .order_by(FuelPumpDelivery.delivery_date.desc(), FuelPumpDelivery.created_at.desc())
            .limit(1)
        )
        latest_delivery = delivery_result.scalar_one_or_none()

        # Use delivery price if available, otherwise 0
        price_per_unit = latest_delivery.price_per_unit if latest_delivery else Decimal("0")
        total_cost = volume * price_per_unit

        # Create internal fuel entry
        fuel_entry = FuelEntry(
            organization_id=employee.organization_id,
            vehicle_id=entry_data.vehicle_id,
            employee_id=entry_data.employee_id,
            pump_id=entry_data.pump_id,
            date=entry_date,
            time=datetime.now(timezone.utc).time(),
            odometer=Decimal(str(entry_data.odometer)),
            volume=volume,
            fuel_type=vehicle.fuel_type,
            price_per_unit=price_per_unit,
            total_cost=total_cost,
            station=f"In-house: {pump.name}",
            is_external=False,
            full_tank=True,
            pump_odometer=Decimal(str(entry_data.pump_odometer)),
            notes=entry_data.notes,
        )
        db.add(fuel_entry)

        # Update vehicle odometer
        vehicle.current_odometer = Decimal(str(entry_data.odometer))
        db.add(vehicle)

        # Update pump level and odometer
        pump.current_level = pump.current_level - Decimal(str(entry_data.volume))
        pump.current_odometer = Decimal(str(entry_data.pump_odometer))
        db.add(pump)

        db.commit()
        return {"success": True, "message": "Fuel entry created successfully"}
