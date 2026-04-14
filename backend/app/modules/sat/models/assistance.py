"""SAT assistance model."""

from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import AssistancePriority, AssistanceStatus


class SatAssistance(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT assistance model - service assistance requests and tracking."""

    __tablename__ = "sat_assistances"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    phc_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, unique=True
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    machine_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_machines.id", ondelete="SET NULL"),
        nullable=True,
    )
    technician_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    service_type_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_service_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    priority: Mapped[AssistancePriority] = mapped_column(
        Enum(AssistancePriority, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssistancePriority.MEDIUM,
    )
    status: Mapped[AssistanceStatus] = mapped_column(
        Enum(AssistanceStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssistanceStatus.REQUESTED,
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    problem_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sla_response_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sla_resolution_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    customer: Mapped["SatCustomer"] = relationship()  # type: ignore[name-defined]
    machine: Mapped["SatMachine | None"] = relationship()  # type: ignore[name-defined]
    technician: Mapped["Employee | None"] = relationship()  # type: ignore[name-defined]
    service_type: Mapped["SatServiceType"] = relationship()  # type: ignore[name-defined]
    report: Mapped["SatInterventionReport | None"] = relationship(  # type: ignore[name-defined]
        uselist=False,
        lazy="selectin",
        back_populates="assistance",
    )
    attachments: Mapped[list["SatAttachment"]] = relationship(  # type: ignore[name-defined]
        primaryjoin="SatAssistance.id == foreign(SatAttachment.assistance_id)",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<SatAssistance(id={self.id}, status={self.status.value})>"
