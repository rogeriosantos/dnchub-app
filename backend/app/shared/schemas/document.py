"""Document schemas."""

from datetime import date

from pydantic import Field

from app.shared.models.enums import DocumentStatus, EntityType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class DocumentBase(BaseSchema):
    """Base document schema."""

    entity_type: EntityType
    entity_id: str
    type: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    file_url: str = Field(..., min_length=1, max_length=500)
    file_size: int | None = Field(None, ge=0)
    mime_type: str | None = Field(None, max_length=100)
    expiry_date: date | None = None
    status: DocumentStatus = DocumentStatus.VALID
    notes: str | None = None


class DocumentCreate(DocumentBase):
    """Document creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    uploaded_by: str


class DocumentUpdate(BaseSchema):
    """Document update schema."""

    type: str | None = Field(None, min_length=1, max_length=100)
    name: str | None = Field(None, min_length=1, max_length=255)
    file_url: str | None = Field(None, min_length=1, max_length=500)
    file_size: int | None = Field(None, ge=0)
    mime_type: str | None = Field(None, max_length=100)
    expiry_date: date | None = None
    status: DocumentStatus | None = None
    notes: str | None = None


class DocumentResponse(DocumentBase, TimestampMixin, SoftDeleteMixin):
    """Document response schema."""

    id: str
    organization_id: str
    uploaded_by: str


class DocumentSummary(BaseSchema):
    """Document summary for lists."""

    id: str
    entity_type: EntityType
    entity_id: str
    type: str
    name: str
    expiry_date: date | None
    status: DocumentStatus
