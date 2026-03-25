"""Fuel pump delivery model for tracking fuel deliveries to in-house tanks."""

from datetime import date, time
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class FuelPumpDelivery(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Fuel pump delivery model - tracks fuel deliveries to in-house pumps/tanks."""

    __tablename__ = "fuel_pump_deliveries"

    # Organization (tenant)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Pump reference
    pump_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("fuel_pumps.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Delivery date and time
    delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    delivery_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    # Volume and cost
    volume: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    price_per_unit: Mapped[Decimal] = mapped_column(
        Numeric(10, 3),
        nullable=False,
    )
    total_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # Supplier info
    supplier: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    receipt_image: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Pump readings at delivery time
    pump_odometer_before: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    pump_odometer_after: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    # Tank levels at delivery time
    level_before: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    level_after: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # Additional
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="fuel_pump_deliveries",
    )
    pump: Mapped["FuelPump"] = relationship(  # type: ignore[name-defined]
        back_populates="deliveries",
    )

    @property
    def volume_difference(self) -> Decimal:
        """Calculate the difference between level_after and level_before."""
        return self.level_after - self.level_before

    def __repr__(self) -> str:
        return f"<FuelPumpDelivery(id={self.id}, pump_id={self.pump_id}, date={self.delivery_date})>"
