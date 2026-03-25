"""Organization model."""

from datetime import datetime

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import DistanceUnit, FuelEfficiencyFormat, VolumeUnit


class Organization(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Organization model - multi-tenant root entity."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    distance_unit: Mapped[DistanceUnit] = mapped_column(
        Enum(DistanceUnit, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DistanceUnit.KM,
    )
    volume_unit: Mapped[VolumeUnit] = mapped_column(
        Enum(VolumeUnit, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=VolumeUnit.L,
    )
    fuel_efficiency_format: Mapped[FuelEfficiencyFormat] = mapped_column(
        Enum(FuelEfficiencyFormat, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=FuelEfficiencyFormat.KM_PER_L,
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="selectin",
    )
    vehicles: Mapped[list["Vehicle"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="selectin",
    )
    employees: Mapped[list["Employee"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="selectin",
    )
    cost_centers: Mapped[list["CostCenter"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="selectin",
    )
    tickets: Mapped[list["Ticket"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="noload",
    )
    fuel_pumps: Mapped[list["FuelPump"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="noload",
    )
    fuel_pump_deliveries: Mapped[list["FuelPumpDelivery"]] = relationship(  # type: ignore[name-defined]
        back_populates="organization",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name={self.name})>"
