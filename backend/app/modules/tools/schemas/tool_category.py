"""Tool category schemas."""

from app.shared.models.enums import ToolStatus
from app.shared.schemas.base import BaseSchema, TimestampMixin


class ToolCategoryBase(BaseSchema):
    """Base tool category schema."""

    name: str
    description: str | None = None


class ToolCategoryCreate(ToolCategoryBase):
    """Tool category creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    parent_id: str | None = None


class ToolCategoryUpdate(BaseSchema):
    """Tool category update schema."""

    name: str | None = None
    description: str | None = None
    parent_id: str | None = None


class ToolCategoryResponse(ToolCategoryBase, TimestampMixin):
    """Tool category response schema."""

    id: str
    organization_id: str
    parent_id: str | None = None
