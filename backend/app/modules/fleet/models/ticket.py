"""Ticket model for traffic/parking violations."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import PaymentMethod, TicketStatus, TicketType


class Ticket(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Ticket model - traffic and parking violations."""

    __tablename__ = "tickets"

    # Organization (tenant)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Vehicle (required)
    vehicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Employee (optional - may not always know who was driving)
    employee_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Ticket identification
    ticket_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    type: Mapped[TicketType] = mapped_column(
        Enum(TicketType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TicketStatus.PENDING,
    )

    # Violation details
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    violation_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    violation_location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    issuing_authority: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Financial
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Payment details
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    payment_method: Mapped[PaymentMethod | None] = mapped_column(
        Enum(PaymentMethod, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    payment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Additional info
    points_deducted: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="tickets",
    )
    vehicle: Mapped["Vehicle"] = relationship(  # type: ignore[name-defined]
        back_populates="tickets",
    )
    employee: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        back_populates="tickets",
    )

    @property
    def is_overdue(self) -> bool:
        """Check if ticket is overdue."""
        if self.status == TicketStatus.PAID or self.status == TicketStatus.CANCELLED:
            return False
        if self.due_date is None:
            return False
        return date.today() > self.due_date

    @property
    def display_name(self) -> str:
        """Get display name for ticket."""
        ticket_num = self.ticket_number or self.id[:8]
        return f"{self.type.value.replace('_', ' ').title()} Ticket #{ticket_num}"

    def __repr__(self) -> str:
        return f"<Ticket(id={self.id}, type={self.type.value}, status={self.status.value})>"
