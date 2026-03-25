"""Fuel pump delivery schemas."""

from datetime import date as dt_date
from datetime import time as dt_time
from decimal import Decimal

from pydantic import Field, field_validator

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class FuelPumpDeliveryBase(BaseSchema):
    """Base fuel pump delivery schema."""

    delivery_date: dt_date
    delivery_time: dt_time | None = None
    volume: Decimal = Field(..., gt=0)
    price_per_unit: Decimal = Field(..., gt=0)
    supplier: str | None = Field(None, max_length=255)
    invoice_number: str | None = Field(None, max_length=100)
    receipt_image: str | None = Field(None, max_length=500)
    pump_odometer_before: Decimal = Field(..., ge=0)
    pump_odometer_after: Decimal | None = Field(None, ge=0)
    level_before: Decimal = Field(..., ge=0)
    level_after: Decimal = Field(..., ge=0)
    notes: str | None = None


class FuelPumpDeliveryCreate(FuelPumpDeliveryBase):
    """Fuel pump delivery creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    pump_id: str

    @field_validator(
        "volume",
        "price_per_unit",
        "pump_odometer_before",
        "pump_odometer_after",
        "level_before",
        "level_after",
        mode="before",
    )
    @classmethod
    def convert_to_decimal(cls, v: float | str | Decimal | None) -> Decimal | None:
        """Convert value to Decimal."""
        if v is None:
            return None
        return Decimal(str(v))


class FuelPumpDeliveryUpdate(BaseSchema):
    """Fuel pump delivery update schema."""

    delivery_date: dt_date | None = None
    delivery_time: dt_time | None = None
    volume: Decimal | None = Field(None, gt=0)
    price_per_unit: Decimal | None = Field(None, gt=0)
    supplier: str | None = Field(None, max_length=255)
    invoice_number: str | None = Field(None, max_length=100)
    receipt_image: str | None = Field(None, max_length=500)
    pump_odometer_after: Decimal | None = Field(None, ge=0)
    notes: str | None = None


class FuelPumpDeliveryResponse(FuelPumpDeliveryBase, TimestampMixin, SoftDeleteMixin):
    """Fuel pump delivery response schema."""

    id: str
    organization_id: str
    pump_id: str
    total_cost: Decimal


class FuelPumpDeliverySummary(BaseSchema):
    """Fuel pump delivery summary for lists."""

    id: str
    pump_id: str
    delivery_date: dt_date
    volume: Decimal
    total_cost: Decimal
    supplier: str | None = None
    invoice_number: str | None = None
