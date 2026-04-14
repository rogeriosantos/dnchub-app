"""SAT attachment model."""

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import AttachmentFileType, AttachmentSource


class SatAttachment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT attachment model - files attached to assistances or reports."""

    __tablename__ = "sat_attachments"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    intervention_report_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_intervention_reports.id", ondelete="CASCADE"),
        nullable=True,
    )
    assistance_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_assistances.id", ondelete="CASCADE"),
        nullable=True,
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[AttachmentFileType] = mapped_column(
        Enum(AttachmentFileType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    source: Mapped[AttachmentSource] = mapped_column(
        Enum(AttachmentSource, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AttachmentSource.WEB_UPLOAD,
    )
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<SatAttachment(id={self.id}, file_type={self.file_type.value})>"
