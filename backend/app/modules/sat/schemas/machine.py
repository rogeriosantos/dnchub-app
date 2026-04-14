"""SAT machine schemas."""

from datetime import date

from pydantic import Field

from app.shared.models.enums import MachineType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatMachineBase(BaseSchema):
    """Base SAT machine schema."""

    customer_id: str
    brand: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    serial_number: str | None = Field(None, max_length=100)
    machine_type: MachineType
    installation_date: date | None = None
    location_notes: str | None = None
    notes: str | None = None


class SatMachineCreate(SatMachineBase):
    """SAT machine creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class SatMachineUpdate(BaseSchema):
    """SAT machine update schema."""

    customer_id: str | None = None
    brand: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    serial_number: str | None = Field(None, max_length=100)
    machine_type: MachineType | None = None
    installation_date: date | None = None
    location_notes: str | None = None
    notes: str | None = None


class SatMachineResponse(SatMachineBase, TimestampMixin, SoftDeleteMixin):
    """SAT machine response schema."""

    id: str
    organization_id: str
