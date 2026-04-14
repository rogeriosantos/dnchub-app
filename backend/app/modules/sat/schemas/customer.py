"""SAT customer schemas."""

from datetime import datetime

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatCustomerBase(BaseSchema):
    """Base SAT customer schema."""

    name: str = Field(..., min_length=1, max_length=255)
    tax_id: str | None = Field(None, max_length=50)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    notes: str | None = None


class SatCustomerCreate(SatCustomerBase):
    """SAT customer creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    phc_id: str | None = Field(None, max_length=100)


class SatCustomerUpdate(BaseSchema):
    """SAT customer update schema."""

    name: str | None = Field(None, min_length=1, max_length=255)
    tax_id: str | None = Field(None, max_length=50)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    notes: str | None = None


class SatCustomerResponse(SatCustomerBase, TimestampMixin, SoftDeleteMixin):
    """SAT customer response schema."""

    id: str
    organization_id: str
    phc_id: str | None = None
    synced_at: datetime | None = None
