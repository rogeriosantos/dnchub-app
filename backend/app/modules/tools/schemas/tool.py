"""Tool schemas."""

from datetime import date
from decimal import Decimal

from app.shared.models.enums import ToolCondition, ToolStatus
from app.shared.schemas.base import BaseSchema, TimestampMixin


class ToolBase(BaseSchema):
    """Base tool schema."""

    erp_code: str
    name: str
    description: str | None = None
    serial_number: str | None = None
    brand: str | None = None
    model: str | None = None
    category_id: str | None = None
    case_id: str | None = None
    status: ToolStatus = ToolStatus.AVAILABLE
    condition: ToolCondition = ToolCondition.NEW
    images: list[str] | None = None
    purchase_date: date | None = None
    purchase_price: Decimal | None = None
    location_id: str | None = None
    calibration_required: bool = False
    calibration_interval_days: int | None = None
    last_calibration_date: date | None = None
    next_calibration_date: date | None = None
    notes: str | None = None


class ToolCreate(ToolBase):
    """Tool creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class ToolUpdate(BaseSchema):
    """Tool update schema."""

    erp_code: str | None = None
    name: str | None = None
    description: str | None = None
    serial_number: str | None = None
    brand: str | None = None
    model: str | None = None
    category_id: str | None = None
    case_id: str | None = None
    status: ToolStatus | None = None
    condition: ToolCondition | None = None
    images: list[str] | None = None
    purchase_date: date | None = None
    purchase_price: Decimal | None = None
    location_id: str | None = None
    calibration_required: bool | None = None
    calibration_interval_days: int | None = None
    last_calibration_date: date | None = None
    next_calibration_date: date | None = None
    notes: str | None = None


class ToolResponse(ToolBase, TimestampMixin):
    """Tool response schema."""

    id: str
    organization_id: str


class ToolSummary(BaseSchema):
    """Tool summary for lightweight listings."""

    id: str
    erp_code: str
    name: str
    status: ToolStatus
    condition: ToolCondition
    case_id: str | None = None
