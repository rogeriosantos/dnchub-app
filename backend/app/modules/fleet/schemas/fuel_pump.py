"""Fuel pump schemas."""

from datetime import date as dt_date
from decimal import Decimal

from pydantic import Field, field_validator

from app.shared.models.enums import FuelType, PumpStatus
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class FuelPumpBase(BaseSchema):
    """Base fuel pump schema."""

    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=50)
    fuel_type: FuelType
    status: PumpStatus = PumpStatus.ACTIVE
    capacity: Decimal = Field(..., gt=0)
    current_level: Decimal = Field(default=Decimal("0"), ge=0)
    minimum_level: Decimal = Field(default=Decimal("0"), ge=0)
    current_odometer: Decimal = Field(default=Decimal("0"), ge=0)
    location: str | None = Field(None, max_length=255)
    last_maintenance_date: dt_date | None = None
    next_maintenance_date: dt_date | None = None
    maintenance_interval_days: int | None = Field(None, ge=1)
    is_default: bool = False
    notes: str | None = None


class FuelPumpCreate(FuelPumpBase):
    """Fuel pump creation schema."""

    organization_id: str | None = None  # Set by backend from auth token

    @field_validator("capacity", "current_level", "minimum_level", "current_odometer", mode="before")
    @classmethod
    def convert_to_decimal(cls, v: float | str | Decimal | None) -> Decimal | None:
        """Convert value to Decimal."""
        if v is None:
            return None
        return Decimal(str(v))


class FuelPumpUpdate(BaseSchema):
    """Fuel pump update schema."""

    name: str | None = Field(None, max_length=100)
    code: str | None = Field(None, max_length=50)
    fuel_type: FuelType | None = None
    status: PumpStatus | None = None
    capacity: Decimal | None = Field(None, gt=0)
    current_level: Decimal | None = Field(None, ge=0)
    minimum_level: Decimal | None = Field(None, ge=0)
    current_odometer: Decimal | None = Field(None, ge=0)
    location: str | None = Field(None, max_length=255)
    last_maintenance_date: dt_date | None = None
    next_maintenance_date: dt_date | None = None
    maintenance_interval_days: int | None = Field(None, ge=1)
    is_default: bool | None = None
    notes: str | None = None


class FuelPumpResponse(FuelPumpBase, TimestampMixin, SoftDeleteMixin):
    """Fuel pump response schema."""

    id: str
    organization_id: str
    # Computed properties
    level_percentage: float | None = None
    is_low_level: bool | None = None
    is_near_capacity: bool | None = None
    is_maintenance_due: bool | None = None


class FuelPumpSummary(BaseSchema):
    """Fuel pump summary for lists/dropdowns."""

    id: str
    name: str
    code: str
    fuel_type: FuelType
    status: PumpStatus
    capacity: Decimal
    current_level: Decimal
    level_percentage: float | None = None
    is_low_level: bool | None = None


class FuelPumpLevelAdjustment(BaseSchema):
    """Schema for manual level adjustment."""

    adjustment: Decimal = Field(..., description="Positive to add, negative to remove")
    reason: str | None = Field(None, max_length=500)

    @field_validator("adjustment", mode="before")
    @classmethod
    def convert_to_decimal(cls, v: float | str | Decimal) -> Decimal:
        """Convert value to Decimal."""
        return Decimal(str(v))
