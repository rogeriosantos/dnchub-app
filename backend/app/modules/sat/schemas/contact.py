"""SAT contact schemas."""

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatContactBase(BaseSchema):
    """Base SAT contact schema."""

    name: str = Field(..., min_length=1, max_length=200)
    role: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    is_whatsapp: bool = False


class SatContactCreate(SatContactBase):
    """SAT contact creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    customer_id: str | None = None  # Set by route from path param


class SatContactUpdate(BaseSchema):
    """SAT contact update schema."""

    name: str | None = Field(None, min_length=1, max_length=200)
    role: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    is_whatsapp: bool | None = None


class SatContactResponse(SatContactBase, TimestampMixin, SoftDeleteMixin):
    """SAT contact response schema."""

    id: str
    organization_id: str
    customer_id: str
