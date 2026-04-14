"""SAT service type schemas."""

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatServiceTypeBase(BaseSchema):
    """Base SAT service type schema."""

    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    is_active: bool = True


class SatServiceTypeCreate(SatServiceTypeBase):
    """SAT service type creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class SatServiceTypeUpdate(BaseSchema):
    """SAT service type update schema."""

    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    is_active: bool | None = None


class SatServiceTypeResponse(SatServiceTypeBase, TimestampMixin, SoftDeleteMixin):
    """SAT service type response schema."""

    id: str
    organization_id: str
