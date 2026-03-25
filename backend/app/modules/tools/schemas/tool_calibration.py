"""Tool calibration schemas."""

from datetime import date, datetime
from decimal import Decimal

from app.shared.schemas.base import BaseSchema


class ToolCalibrationBase(BaseSchema):
    """Base tool calibration schema."""

    tool_id: str
    calibration_date: date
    next_calibration_date: date | None = None
    certificate_number: str | None = None
    calibrated_by: str | None = None
    certificate_url: str | None = None
    cost: Decimal | None = None
    notes: str | None = None


class ToolCalibrationCreate(ToolCalibrationBase):
    """Tool calibration creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class ToolCalibrationUpdate(BaseSchema):
    """Tool calibration update schema."""

    calibration_date: date | None = None
    next_calibration_date: date | None = None
    certificate_number: str | None = None
    calibrated_by: str | None = None
    certificate_url: str | None = None
    cost: Decimal | None = None
    notes: str | None = None


class ToolCalibrationResponse(ToolCalibrationBase):
    """Tool calibration response schema."""

    id: str
    organization_id: str
    tool_id: str
    created_at: datetime
    updated_at: datetime
