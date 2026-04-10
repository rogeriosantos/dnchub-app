"""SAT customer model."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatCustomer(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT customer model - external customers served by service assistances."""

    __tablename__ = "sat_customers"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    phc_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, unique=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    contacts: Mapped[list["SatContact"]] = relationship(  # type: ignore[name-defined]
        back_populates="customer",
        lazy="selectin",
    )
    machines: Mapped[list["SatMachine"]] = relationship(  # type: ignore[name-defined]
        back_populates="customer",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<SatCustomer(id={self.id}, name={self.name})>"
