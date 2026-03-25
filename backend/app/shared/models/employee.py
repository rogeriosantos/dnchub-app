"""Employee model."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import EmployeeStatus


class Employee(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Employee model - personnel with licensing and assignment info."""

    __tablename__ = "employees"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    user_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    employee_id: Mapped[str] = mapped_column(String(50), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[EmployeeStatus] = mapped_column(
        Enum(EmployeeStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EmployeeStatus.AVAILABLE,
    )
    license_number: Mapped[str] = mapped_column(String(100), nullable=False)
    license_issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    license_class: Mapped[str] = mapped_column(String(20), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_vehicle_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
    )
    cost_center_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cost_centers.id", ondelete="SET NULL"),
        nullable=True,
    )
    pin_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    total_trips: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_distance: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )
    fuel_efficiency_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    safety_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    is_backoffice: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="employees",
    )
    user: Mapped["User | None"] = relationship()  # type: ignore[name-defined]
    assigned_vehicle: Mapped["Vehicle | None"] = relationship(  # type: ignore[name-defined]
        foreign_keys=[assigned_vehicle_id],
    )
    assigned_vehicles: Mapped[list["Vehicle"]] = relationship(  # type: ignore[name-defined]
        back_populates="assigned_employee",
        foreign_keys="Vehicle.assigned_employee_id",
    )
    cost_center: Mapped["CostCenter | None"] = relationship(  # type: ignore[name-defined]
        back_populates="employees",
    )
    fuel_entries: Mapped[list["FuelEntry"]] = relationship(  # type: ignore[name-defined]
        back_populates="employee",
        lazy="selectin",
    )
    trips: Mapped[list["Trip"]] = relationship(  # type: ignore[name-defined]
        back_populates="employee",
        lazy="selectin",
    )
    tickets: Mapped[list["Ticket"]] = relationship(  # type: ignore[name-defined]
        back_populates="employee",
        lazy="noload",
    )

    @property
    def full_name(self) -> str:
        """Get full name of employee."""
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, name={self.full_name})>"
