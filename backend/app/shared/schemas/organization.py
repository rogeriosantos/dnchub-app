"""Organization schemas."""

from datetime import datetime

from pydantic import EmailStr, Field

from app.shared.models.enums import DistanceUnit, FuelEfficiencyFormat, VolumeUnit
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class OrganizationBase(BaseSchema):
    """Base organization schema."""

    name: str = Field(..., min_length=1, max_length=255)
    logo: str | None = Field(None, max_length=500)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=50)
    email: EmailStr | None = None
    website: str | None = Field(None, max_length=500)
    timezone: str = Field(default="UTC", max_length=100)
    currency: str = Field(default="USD", max_length=10)
    distance_unit: DistanceUnit = DistanceUnit.KM
    volume_unit: VolumeUnit = VolumeUnit.L
    fuel_efficiency_format: FuelEfficiencyFormat = FuelEfficiencyFormat.KM_PER_L


class OrganizationCreate(OrganizationBase):
    """Organization creation schema."""

    pass


class OrganizationUpdate(BaseSchema):
    """Organization update schema."""

    name: str | None = Field(None, min_length=1, max_length=255)
    logo: str | None = Field(None, max_length=500)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=50)
    email: EmailStr | None = None
    website: str | None = Field(None, max_length=500)
    timezone: str | None = Field(None, max_length=100)
    currency: str | None = Field(None, max_length=10)
    distance_unit: DistanceUnit | None = None
    volume_unit: VolumeUnit | None = None
    fuel_efficiency_format: FuelEfficiencyFormat | None = None


class OrganizationResponse(OrganizationBase, TimestampMixin, SoftDeleteMixin):
    """Organization response schema."""

    id: str


class OrganizationSummary(BaseSchema):
    """Organization summary for nested responses."""

    id: str
    name: str
