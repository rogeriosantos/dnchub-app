"""Maintenance models."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import (
    IntervalType,
    MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType,
)


class MaintenanceTask(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Maintenance task model - maintenance work orders and service records."""

    __tablename__ = "maintenance_tasks"

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
    type: Mapped[MaintenanceType] = mapped_column(
        Enum(MaintenanceType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MaintenanceStatus.SCHEDULED,
    )
    priority: Mapped[MaintenancePriority] = mapped_column(
        Enum(MaintenancePriority, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MaintenancePriority.MEDIUM,
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_odometer: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    completed_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    estimated_cost: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    actual_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    labor_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    parts_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    service_provider: Mapped[str | None] = mapped_column(String(255), nullable=True)
    service_provider_contact: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachments: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text),
        nullable=True,
    )
    work_order_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cost_center_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cost_centers.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship(  # type: ignore[name-defined]
        back_populates="maintenance_tasks",
    )
    cost_center: Mapped["CostCenter | None"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<MaintenanceTask(id={self.id}, title={self.title}, status={self.status})>"


class MaintenanceSchedule(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Maintenance schedule model - recurring maintenance templates."""

    __tablename__ = "maintenance_schedules"

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
    task_name: Mapped[str] = mapped_column(String(255), nullable=False)
    interval_type: Mapped[IntervalType] = mapped_column(
        Enum(IntervalType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    interval_mileage: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_completed_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    next_due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_due_odometer: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    estimated_cost: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<MaintenanceSchedule(id={self.id}, task={self.task_name})>"
