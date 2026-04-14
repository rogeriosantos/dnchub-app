"""SAT machine model."""

from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import MachineType


class SatMachine(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT machine model - customer machines that receive service."""

    __tablename__ = "sat_machines"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    machine_type: Mapped[MachineType] = mapped_column(
        Enum(MachineType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    installation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    customer: Mapped["SatCustomer"] = relationship(  # type: ignore[name-defined]
        back_populates="machines",
    )

    @property
    def display_name(self) -> str:
        """Get display name for machine."""
        parts = [p for p in [self.brand, self.model] if p]
        name = " ".join(parts) if parts else "Unknown Machine"
        if self.serial_number:
            name += f" (S/N: {self.serial_number})"
        return name

    def __repr__(self) -> str:
        return f"<SatMachine(id={self.id}, type={self.machine_type.value})>"
