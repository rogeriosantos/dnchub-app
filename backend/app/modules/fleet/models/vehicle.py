"""Vehicle model."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import FuelType, VehicleStatus, VehicleType


class Vehicle(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Vehicle model - fleet vehicles with tracking and maintenance info."""

    __tablename__ = "vehicles"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    registration_plate: Mapped[str] = mapped_column(String(50), nullable=False)
    vin: Mapped[str | None] = mapped_column(String(17), nullable=True)
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    type: Mapped[VehicleType] = mapped_column(
        Enum(VehicleType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    fuel_type: Mapped[FuelType] = mapped_column(
        Enum(FuelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status: Mapped[VehicleStatus] = mapped_column(
        Enum(VehicleStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=VehicleStatus.ACTIVE,
    )
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_odometer: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )
    fuel_capacity: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )
    assigned_employee_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    cost_center_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cost_centers.id", ondelete="SET NULL"),
        nullable=True,
    )
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    insurance_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    insurance_provider: Mapped[str | None] = mapped_column(String(255), nullable=True)
    insurance_policy_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    registration_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_service_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_service_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_service_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    average_fuel_efficiency: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2),
        nullable=True,
    )
    total_fuel_cost: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
        default=0,
    )
    total_maintenance_cost: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
        default=0,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="vehicles",
    )
    assigned_employee: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        back_populates="assigned_vehicles",
        foreign_keys=[assigned_employee_id],
    )
    cost_center: Mapped["CostCenter | None"] = relationship(  # type: ignore[name-defined]
        back_populates="vehicles",
    )
    fuel_entries: Mapped[list["FuelEntry"]] = relationship(  # type: ignore[name-defined]
        back_populates="vehicle",
        lazy="selectin",
    )
    maintenance_tasks: Mapped[list["MaintenanceTask"]] = relationship(  # type: ignore[name-defined]
        back_populates="vehicle",
        lazy="selectin",
    )
    trips: Mapped[list["Trip"]] = relationship(  # type: ignore[name-defined]
        back_populates="vehicle",
        lazy="selectin",
    )
    tickets: Mapped[list["Ticket"]] = relationship(  # type: ignore[name-defined]
        back_populates="vehicle",
        lazy="noload",
    )

    @property
    def display_name(self) -> str:
        """Get display name for vehicle."""
        return f"{self.make} {self.model} ({self.registration_plate})"

    def __repr__(self) -> str:
        return f"<Vehicle(id={self.id}, plate={self.registration_plate})>"


class VehicleGroup(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Vehicle group model - logical grouping of vehicles."""

    __tablename__ = "vehicle_groups"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    members: Mapped[list["VehicleGroupMember"]] = relationship(
        back_populates="group",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<VehicleGroup(id={self.id}, name={self.name})>"


class VehicleGroupMember(Base, UUIDMixin):
    """Vehicle group member junction table."""

    __tablename__ = "vehicle_group_members"

    vehicle_group_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicle_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    vehicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    group: Mapped["VehicleGroup"] = relationship(back_populates="members")
    vehicle: Mapped["Vehicle"] = relationship()

    def __repr__(self) -> str:
        return f"<VehicleGroupMember(group={self.vehicle_group_id}, vehicle={self.vehicle_id})>"
