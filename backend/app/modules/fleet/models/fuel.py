"""Fuel entry model."""

from datetime import date, time
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import FuelType


class FuelEntry(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Fuel entry model - fuel purchase and consumption records."""

    __tablename__ = "fuel_entries"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    vehicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    employee_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    time: Mapped[time | None] = mapped_column(Time, nullable=True)
    volume: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(
        Enum(FuelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    odometer: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    previous_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    distance: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    fuel_efficiency: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2),
        nullable=True,
    )
    station: Mapped[str | None] = mapped_column(String(255), nullable=True)
    station_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    receipt_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    receipt_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_external: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    full_tank: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_center_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cost_centers.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Pump reference (for in-house pumps)
    pump_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("fuel_pumps.id", ondelete="SET NULL"),
        nullable=True,
    )
    pump_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship(  # type: ignore[name-defined]
        back_populates="fuel_entries",
    )
    employee: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        back_populates="fuel_entries",
    )
    cost_center: Mapped["CostCenter | None"] = relationship()  # type: ignore[name-defined]
    pump: Mapped["FuelPump | None"] = relationship(  # type: ignore[name-defined]
        back_populates="fuel_entries",
    )

    def __repr__(self) -> str:
        return f"<FuelEntry(id={self.id}, vehicle={self.vehicle_id}, date={self.date})>"
