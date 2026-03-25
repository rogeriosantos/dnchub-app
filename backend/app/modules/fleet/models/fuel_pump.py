"""Fuel pump model for in-house fuel tank management."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import FuelType, PumpStatus


class FuelPump(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Fuel pump model - in-house fuel tank/pump management."""

    __tablename__ = "fuel_pumps"

    # Organization (tenant)
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Identification
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(
        Enum(FuelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status: Mapped[PumpStatus] = mapped_column(
        Enum(PumpStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PumpStatus.ACTIVE,
    )

    # Capacity and levels (in liters)
    capacity: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    current_level: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )
    minimum_level: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )

    # Pump odometer (meter reading)
    current_odometer: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )

    # Location
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Maintenance
    last_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    maintenance_interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Additional
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="fuel_pumps",
    )
    fuel_entries: Mapped[list["FuelEntry"]] = relationship(  # type: ignore[name-defined]
        back_populates="pump",
        lazy="noload",
    )
    deliveries: Mapped[list["FuelPumpDelivery"]] = relationship(  # type: ignore[name-defined]
        back_populates="pump",
        lazy="noload",
    )

    @property
    def level_percentage(self) -> float:
        """Calculate current level as percentage of capacity."""
        if self.capacity <= 0:
            return 0.0
        return float((self.current_level / self.capacity) * 100)

    @property
    def is_low_level(self) -> bool:
        """Check if fuel level is at or below minimum threshold."""
        return self.current_level <= self.minimum_level

    @property
    def is_near_capacity(self) -> bool:
        """Check if fuel level is near capacity (>= 95%)."""
        return self.current_level >= (self.capacity * Decimal("0.95"))

    @property
    def is_maintenance_due(self) -> bool:
        """Check if maintenance is due."""
        if self.next_maintenance_date is None:
            return False
        return date.today() >= self.next_maintenance_date

    @property
    def display_name(self) -> str:
        """Get display name for pump."""
        return f"{self.name} ({self.code})"

    def __repr__(self) -> str:
        return f"<FuelPump(id={self.id}, name={self.name}, code={self.code})>"
