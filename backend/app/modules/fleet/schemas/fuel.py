"""Fuel entry schemas."""

from datetime import date as dt_date
from datetime import time as dt_time
from decimal import Decimal

from pydantic import Field, field_validator

from app.shared.models.enums import FuelType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class FuelEntryBase(BaseSchema):
    """Base fuel entry schema."""

    date: dt_date
    time: dt_time | None = None
    volume: Decimal = Field(..., gt=0)
    price_per_unit: Decimal = Field(..., ge=0)  # Allow 0 for in-house fuel (POS)
    fuel_type: FuelType
    odometer: Decimal = Field(..., ge=0)
    station: str | None = Field(None, max_length=255)
    station_address: str | None = None
    receipt_number: str | None = Field(None, max_length=100)
    receipt_image: str | None = Field(None, max_length=500)
    full_tank: bool = False
    payment_method: str | None = Field(None, max_length=50)
    notes: str | None = None


class FuelEntryCreate(FuelEntryBase):
    """Fuel entry creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_id: str
    employee_id: str | None = None
    cost_center_id: str | None = None
    pump_id: str | None = None  # For in-house pump entries
    pump_odometer: Decimal | None = Field(None, ge=0)

    @field_validator("volume", "price_per_unit", "pump_odometer", mode="before")
    @classmethod
    def convert_to_decimal(cls, v: float | str | Decimal | None) -> Decimal | None:
        """Convert value to Decimal."""
        if v is None:
            return None
        return Decimal(str(v))


class FuelEntryUpdate(BaseSchema):
    """Fuel entry update schema."""

    date: dt_date | None = None
    time: dt_time | None = None
    volume: Decimal | None = Field(None, gt=0)
    price_per_unit: Decimal | None = Field(None, ge=0)  # Allow 0 for in-house fuel (POS)
    fuel_type: FuelType | None = None
    odometer: Decimal | None = Field(None, ge=0)
    station: str | None = Field(None, max_length=255)
    station_address: str | None = None
    receipt_number: str | None = Field(None, max_length=100)
    receipt_image: str | None = Field(None, max_length=500)
    full_tank: bool | None = None
    payment_method: str | None = Field(None, max_length=50)
    notes: str | None = None
    employee_id: str | None = None
    cost_center_id: str | None = None
    pump_id: str | None = None
    pump_odometer: Decimal | None = Field(None, ge=0)


class FuelEntryResponse(FuelEntryBase, TimestampMixin, SoftDeleteMixin):
    """Fuel entry response schema."""

    id: str
    organization_id: str
    vehicle_id: str
    employee_id: str | None = None
    cost_center_id: str | None = None
    pump_id: str | None = None
    pump_odometer: Decimal | None = None
    total_cost: Decimal
    previous_odometer: Decimal | None = None
    distance: Decimal | None = None
    fuel_efficiency: Decimal | None = None


class FuelEntrySummary(BaseSchema):
    """Fuel entry summary for lists."""

    id: str
    vehicle_id: str
    date: dt_date
    volume: Decimal
    total_cost: Decimal
    fuel_type: FuelType
    odometer: Decimal
    fuel_efficiency: Decimal | None = None


class FuelAnalytics(BaseSchema):
    """Fuel analytics summary."""

    total_volume: Decimal
    total_cost: Decimal
    average_price_per_unit: Decimal
    average_efficiency: Decimal | None
    entries_count: int
    period_start: dt_date
    period_end: dt_date
