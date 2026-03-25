"""Tool case schemas."""

from app.shared.models.enums import ToolCondition, ToolStatus
from app.shared.schemas.base import BaseSchema, TimestampMixin


class ToolCaseBase(BaseSchema):
    """Base tool case schema."""

    erp_code: str
    name: str
    description: str | None = None
    status: ToolStatus = ToolStatus.AVAILABLE
    condition: ToolCondition = ToolCondition.NEW
    images: list[str] | None = None
    notes: str | None = None
    location_id: str | None = None


class ToolCaseCreate(ToolCaseBase):
    """Tool case creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class ToolCaseUpdate(BaseSchema):
    """Tool case update schema."""

    erp_code: str | None = None
    name: str | None = None
    description: str | None = None
    status: ToolStatus | None = None
    condition: ToolCondition | None = None
    images: list[str] | None = None
    notes: str | None = None
    location_id: str | None = None


class ToolCaseResponse(ToolCaseBase, TimestampMixin):
    """Tool case response schema."""

    id: str
    organization_id: str
