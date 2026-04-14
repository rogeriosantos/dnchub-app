"""SAT intervention report schemas."""

from datetime import datetime

from pydantic import Field

from app.shared.models.enums import ReportStatus
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatInterventionReportBase(BaseSchema):
    """Base SAT intervention report schema."""

    assistance_id: str
    technician_id: str
    diagnosis: str | None = None
    actions_taken: str | None = None
    parts_replaced: list[str] | None = Field(default_factory=list)
    time_travel_minutes: int | None = Field(None, ge=0)
    time_onsite_minutes: int | None = Field(None, ge=0)
    next_steps: str | None = None
    report_status: ReportStatus = ReportStatus.DRAFT


class SatInterventionReportCreate(SatInterventionReportBase):
    """SAT intervention report creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class SatInterventionReportUpdate(BaseSchema):
    """SAT intervention report update schema."""

    assistance_id: str | None = None
    technician_id: str | None = None
    diagnosis: str | None = None
    actions_taken: str | None = None
    parts_replaced: list[str] | None = None
    time_travel_minutes: int | None = Field(None, ge=0)
    time_onsite_minutes: int | None = Field(None, ge=0)
    next_steps: str | None = None
    report_status: ReportStatus | None = None


class SatInterventionReportResponse(
    SatInterventionReportBase, TimestampMixin, SoftDeleteMixin
):
    """SAT intervention report response schema."""

    id: str
    organization_id: str
    ai_raw_transcription: str | None = None
    ai_structured_draft: str | None = None
    customer_signature_url: str | None = None
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
