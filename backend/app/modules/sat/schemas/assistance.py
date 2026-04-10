"""SAT assistance schemas."""

from datetime import date, datetime, time

from pydantic import Field

from app.shared.models.enums import AssistancePriority, AssistanceStatus
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatAssistanceBase(BaseSchema):
    """Base SAT assistance schema."""

    customer_id: str
    machine_id: str | None = None
    technician_id: str | None = None
    service_type_id: str
    priority: AssistancePriority = AssistancePriority.MEDIUM
    status: AssistanceStatus = AssistanceStatus.REQUESTED
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    problem_description: str | None = None


class SatAssistanceCreate(SatAssistanceBase):
    """SAT assistance creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    phc_id: str | None = Field(None, max_length=100)


class SatAssistanceUpdate(BaseSchema):
    """SAT assistance update schema."""

    customer_id: str | None = None
    machine_id: str | None = None
    technician_id: str | None = None
    service_type_id: str | None = None
    priority: AssistancePriority | None = None
    status: AssistanceStatus | None = None
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    problem_description: str | None = None


class SatAssistanceResponse(SatAssistanceBase, TimestampMixin, SoftDeleteMixin):
    """SAT assistance response schema."""

    id: str
    organization_id: str
    phc_id: str | None = None
    sla_response_deadline: datetime | None = None
    sla_resolution_deadline: datetime | None = None


class SatAssistanceStatusUpdate(BaseSchema):
    """SAT assistance status update schema."""

    status: AssistanceStatus
