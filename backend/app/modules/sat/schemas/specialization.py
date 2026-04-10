"""SAT specialization schemas."""

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatSpecializationBase(BaseSchema):
    """Base SAT specialization schema."""

    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    is_active: bool = True


class SatSpecializationCreate(SatSpecializationBase):
    """SAT specialization creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class SatSpecializationUpdate(BaseSchema):
    """SAT specialization update schema."""

    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    is_active: bool | None = None


class SatSpecializationResponse(SatSpecializationBase, TimestampMixin, SoftDeleteMixin):
    """SAT specialization response schema."""

    id: str
    organization_id: str
