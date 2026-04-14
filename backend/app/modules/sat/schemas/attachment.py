"""SAT attachment schemas."""

from pydantic import Field

from app.shared.models.enums import AttachmentFileType, AttachmentSource
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatAttachmentCreate(BaseSchema):
    """SAT attachment creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    intervention_report_id: str | None = None
    assistance_id: str | None = None
    file_url: str = Field(..., max_length=500)
    file_type: AttachmentFileType
    source: AttachmentSource = AttachmentSource.WEB_UPLOAD
    caption: str | None = None


class SatAttachmentResponse(BaseSchema, TimestampMixin, SoftDeleteMixin):
    """SAT attachment response schema."""

    id: str
    organization_id: str
    intervention_report_id: str | None = None
    assistance_id: str | None = None
    file_url: str
    file_type: AttachmentFileType
    source: AttachmentSource
    caption: str | None = None
