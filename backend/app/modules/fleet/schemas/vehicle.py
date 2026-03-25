"""Vehicle schemas."""

from datetime import date
from decimal import Decimal

from pydantic import Field, field_validator

from app.shared.models.enums import FuelType, VehicleStatus, VehicleType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class VehicleBase(BaseSchema):
    """Base vehicle schema."""

    registration_plate: str = Field(..., min_length=1, max_length=50)
    vin: str | None = Field(None, min_length=17, max_length=17)
    make: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    type: VehicleType
    fuel_type: FuelType
    status: VehicleStatus = VehicleStatus.ACTIVE
    color: str | None = Field(None, max_length=50)
    current_odometer: Decimal = Field(default=0, ge=0)
    fuel_capacity: Decimal | None = Field(None, gt=0)
    image: str | None = Field(None, max_length=500)
    insurance_expiry: date | None = None
    insurance_provider: str | None = Field(None, max_length=255)
    insurance_policy_number: str | None = Field(None, max_length=100)
    registration_expiry: date | None = None
    last_service_date: date | None = None
    next_service_date: date | None = None
    next_service_odometer: Decimal | None = Field(None, ge=0)
    notes: str | None = None


class VehicleCreate(VehicleBase):
    """Vehicle creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    assigned_employee_id: str | None = None
    cost_center_id: str | None = None


class VehicleUpdate(BaseSchema):
    """Vehicle update schema."""

    registration_plate: str | None = Field(None, min_length=1, max_length=50)
    vin: str | None = Field(None, min_length=17, max_length=17)
    make: str | None = Field(None, min_length=1, max_length=100)
    model: str | None = Field(None, min_length=1, max_length=100)
    year: int | None = Field(None, ge=1900, le=2100)
    type: VehicleType | None = None
    fuel_type: FuelType | None = None
    status: VehicleStatus | None = None
    color: str | None = Field(None, max_length=50)
    current_odometer: Decimal | None = Field(None, ge=0)
    fuel_capacity: Decimal | None = Field(None, gt=0)
    assigned_employee_id: str | None = None
    cost_center_id: str | None = None
    image: str | None = Field(None, max_length=500)
    insurance_expiry: date | None = None
    insurance_provider: str | None = Field(None, max_length=255)
    insurance_policy_number: str | None = Field(None, max_length=100)
    registration_expiry: date | None = None
    last_service_date: date | None = None
    next_service_date: date | None = None
    next_service_odometer: Decimal | None = Field(None, ge=0)
    notes: str | None = None


class VehicleResponse(VehicleBase, TimestampMixin, SoftDeleteMixin):
    """Vehicle response schema."""

    id: str
    organization_id: str
    assigned_employee_id: str | None = None
    cost_center_id: str | None = None
    average_fuel_efficiency: Decimal | None = None
    total_fuel_cost: Decimal | None = None
    total_maintenance_cost: Decimal | None = None

    @property
    def display_name(self) -> str:
        """Get display name."""
        return f"{self.make} {self.model} ({self.registration_plate})"


class VehicleSummary(BaseSchema):
    """Vehicle summary for nested responses."""

    id: str
    registration_plate: str
    make: str
    model: str
    year: int
    status: VehicleStatus
    current_odometer: Decimal


class VehicleGroupBase(BaseSchema):
    """Base vehicle group schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class VehicleGroupCreate(VehicleGroupBase):
    """Vehicle group creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_ids: list[str] = []


class VehicleGroupUpdate(BaseSchema):
    """Vehicle group update schema."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    vehicle_ids: list[str] | None = None


class VehicleGroupResponse(VehicleGroupBase, TimestampMixin, SoftDeleteMixin):
    """Vehicle group response schema."""

    id: str
    organization_id: str
    vehicles: list[VehicleSummary] = []
