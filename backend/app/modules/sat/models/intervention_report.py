"""SAT intervention report model."""

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import ReportStatus


class SatInterventionReport(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT intervention report model - detailed report of a service assistance."""

    __tablename__ = "sat_intervention_reports"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    assistance_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_assistances.id", ondelete="CASCADE"),
        nullable=False,
    )
    technician_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
    )
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    actions_taken: Mapped[str | None] = mapped_column(Text, nullable=True)
    parts_replaced: Mapped[list | None] = mapped_column(
        JSON, nullable=True, default=list
    )
    time_travel_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_onsite_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    next_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_raw_transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_structured_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_signature_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    report_status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ReportStatus.DRAFT,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    assistance: Mapped["SatAssistance"] = relationship(  # type: ignore[name-defined]
        back_populates="report",
    )
    technician: Mapped["Employee"] = relationship()  # type: ignore[name-defined]
    attachments: Mapped[list["SatAttachment"]] = relationship(  # type: ignore[name-defined]
        primaryjoin="SatInterventionReport.id == foreign(SatAttachment.intervention_report_id)",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<SatInterventionReport("
            f"id={self.id}, "
            f"status={self.report_status.value})>"
        )
