"""Tool location schemas."""

from app.shared.schemas.base import BaseSchema, TimestampMixin


class ToolLocationBase(BaseSchema):
    """Base tool location schema."""

    name: str
    description: str | None = None
    address: str | None = None
    is_active: bool = True


class ToolLocationCreate(ToolLocationBase):
    """Tool location creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class ToolLocationUpdate(BaseSchema):
    """Tool location update schema."""

    name: str | None = None
    description: str | None = None
    address: str | None = None
    is_active: bool | None = None


class ToolLocationResponse(ToolLocationBase, TimestampMixin):
    """Tool location response schema."""

    id: str
    organization_id: str
