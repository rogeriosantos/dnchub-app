"""Tool assignment schemas."""

from datetime import datetime

from app.shared.models.enums import ToolAssignmentType, ToolCondition
from app.shared.schemas.base import BaseSchema


class ToolAssignmentBase(BaseSchema):
    """Base tool assignment schema."""

    tool_id: str | None = None
    case_id: str | None = None
    assignment_type: ToolAssignmentType
    assigned_to_employee_id: str | None = None
    assigned_to_vehicle_id: str | None = None
    department: str | None = None
    section: str | None = None
    location_id: str | None = None
    condition_at_checkout: ToolCondition | None = None
    notes: str | None = None


class ToolAssignmentCreate(ToolAssignmentBase):
    """Tool assignment creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    assigned_by_id: str | None = None  # Set by backend from auth token


class ToolAssignmentReturn(BaseSchema):
    """Tool assignment return schema."""

    condition_at_return: ToolCondition | None = None
    notes: str | None = None


class ToolAssignmentResponse(ToolAssignmentBase):
    """Tool assignment response schema."""

    id: str
    organization_id: str
    assigned_at: datetime
    returned_at: datetime | None = None
    assigned_by_id: str
    condition_at_return: ToolCondition | None = None
    created_at: datetime
    updated_at: datetime
