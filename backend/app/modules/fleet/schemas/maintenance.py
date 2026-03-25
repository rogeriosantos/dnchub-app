"""Maintenance schemas."""

from datetime import date
from decimal import Decimal

from pydantic import Field

from app.shared.models.enums import (
    IntervalType,
    MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType,
)
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class MaintenanceTaskBase(BaseSchema):
    """Base maintenance task schema."""

    type: MaintenanceType
    category: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    status: MaintenanceStatus = MaintenanceStatus.SCHEDULED
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    scheduled_date: date | None = None
    due_odometer: Decimal | None = Field(None, ge=0)
    estimated_cost: Decimal | None = Field(None, ge=0)
    service_provider: str | None = Field(None, max_length=255)
    service_provider_contact: str | None = Field(None, max_length=255)
    assigned_to: str | None = Field(None, max_length=255)
    notes: str | None = None
    work_order_number: str | None = Field(None, max_length=100)


class MaintenanceTaskCreate(MaintenanceTaskBase):
    """Maintenance task creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_id: str
    cost_center_id: str | None = None


class MaintenanceTaskUpdate(BaseSchema):
    """Maintenance task update schema."""

    type: MaintenanceType | None = None
    category: str | None = Field(None, min_length=1, max_length=100)
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: MaintenanceStatus | None = None
    priority: MaintenancePriority | None = None
    scheduled_date: date | None = None
    completed_date: date | None = None
    due_odometer: Decimal | None = Field(None, ge=0)
    completed_odometer: Decimal | None = Field(None, ge=0)
    estimated_cost: Decimal | None = Field(None, ge=0)
    actual_cost: Decimal | None = Field(None, ge=0)
    labor_cost: Decimal | None = Field(None, ge=0)
    parts_cost: Decimal | None = Field(None, ge=0)
    service_provider: str | None = Field(None, max_length=255)
    service_provider_contact: str | None = Field(None, max_length=255)
    assigned_to: str | None = Field(None, max_length=255)
    notes: str | None = None
    attachments: list[str] | None = None
    work_order_number: str | None = Field(None, max_length=100)
    cost_center_id: str | None = None


class MaintenanceTaskResponse(MaintenanceTaskBase, TimestampMixin, SoftDeleteMixin):
    """Maintenance task response schema."""

    id: str
    organization_id: str
    vehicle_id: str
    cost_center_id: str | None = None
    completed_date: date | None = None
    completed_odometer: Decimal | None = None
    actual_cost: Decimal | None = None
    labor_cost: Decimal | None = None
    parts_cost: Decimal | None = None
    attachments: list[str] | None = None


class MaintenanceTaskSummary(BaseSchema):
    """Maintenance task summary for lists."""

    id: str
    vehicle_id: str
    title: str
    type: MaintenanceType
    status: MaintenanceStatus
    priority: MaintenancePriority
    scheduled_date: date | None
    estimated_cost: Decimal | None


class MaintenanceScheduleBase(BaseSchema):
    """Base maintenance schedule schema."""

    task_name: str = Field(..., min_length=1, max_length=255)
    interval_type: IntervalType
    interval_mileage: Decimal | None = Field(None, gt=0)
    interval_days: int | None = Field(None, gt=0)
    estimated_cost: Decimal | None = Field(None, ge=0)
    is_active: bool = True


class MaintenanceScheduleCreate(MaintenanceScheduleBase):
    """Maintenance schedule creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_id: str


class MaintenanceScheduleUpdate(BaseSchema):
    """Maintenance schedule update schema."""

    task_name: str | None = Field(None, min_length=1, max_length=255)
    interval_type: IntervalType | None = None
    interval_mileage: Decimal | None = Field(None, gt=0)
    interval_days: int | None = Field(None, gt=0)
    last_completed_date: date | None = None
    last_completed_odometer: Decimal | None = Field(None, ge=0)
    next_due_date: date | None = None
    next_due_odometer: Decimal | None = Field(None, ge=0)
    estimated_cost: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None


class MaintenanceScheduleResponse(MaintenanceScheduleBase, TimestampMixin, SoftDeleteMixin):
    """Maintenance schedule response schema."""

    id: str
    organization_id: str
    vehicle_id: str
    last_completed_date: date | None = None
    last_completed_odometer: Decimal | None = None
    next_due_date: date | None = None
    next_due_odometer: Decimal | None = None
