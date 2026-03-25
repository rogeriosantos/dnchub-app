"""Notification Preferences schemas."""

from datetime import datetime
from typing import Any

from pydantic import EmailStr, Field

from app.shared.schemas.base import BaseSchema


# Default notification settings for new users
DEFAULT_NOTIFICATION_SETTINGS: dict[str, dict[str, bool]] = {
    # Vehicle alerts
    "vehicle_status": {"email": True, "push": True, "sms": False},
    "vehicle_assignment": {"email": True, "push": True, "sms": False},
    "vehicle_inspection": {"email": True, "push": True, "sms": True},
    # Maintenance
    "maint_due": {"email": True, "push": True, "sms": True},
    "maint_overdue": {"email": True, "push": True, "sms": True},
    "maint_completed": {"email": True, "push": False, "sms": False},
    "work_order": {"email": True, "push": True, "sms": False},
    # Fuel & Expenses
    "fuel_transaction": {"email": False, "push": True, "sms": False},
    "fuel_anomaly": {"email": True, "push": True, "sms": False},
    "expense_approval": {"email": True, "push": True, "sms": False},
    # GPS & Tracking
    "geofence_enter": {"email": False, "push": True, "sms": False},
    "geofence_exit": {"email": False, "push": True, "sms": False},
    "speed_alert": {"email": False, "push": True, "sms": True},
    "idle_alert": {"email": False, "push": True, "sms": False},
    # Compliance
    "license_expiry": {"email": True, "push": True, "sms": True},
    "insurance_expiry": {"email": True, "push": True, "sms": True},
    "registration_expiry": {"email": True, "push": True, "sms": False},
    # Financial
    "budget_threshold": {"email": True, "push": True, "sms": False},
    "cost_anomaly": {"email": True, "push": False, "sms": False},
    "report_ready": {"email": True, "push": False, "sms": False},
}


class NotificationSettingItem(BaseSchema):
    """Individual notification setting for a specific notification type."""

    email: bool = True
    push: bool = True
    sms: bool = False


class NotificationPreferencesBase(BaseSchema):
    """Base schema for notification preferences."""

    # Channel settings
    email_enabled: bool = True
    push_enabled: bool = True
    sms_enabled: bool = False

    # Contact info (optional override)
    email_address: str | None = None
    phone_number: str | None = None

    # Quiet hours settings
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"

    # Per-notification preferences
    notification_settings: dict[str, dict[str, bool]] = Field(
        default_factory=lambda: DEFAULT_NOTIFICATION_SETTINGS.copy()
    )


class NotificationPreferencesCreate(NotificationPreferencesBase):
    """Schema for creating notification preferences."""

    pass


class NotificationPreferencesUpdate(BaseSchema):
    """Schema for updating notification preferences."""

    # Channel settings
    email_enabled: bool | None = None
    push_enabled: bool | None = None
    sms_enabled: bool | None = None

    # Contact info
    email_address: str | None = None
    phone_number: str | None = None

    # Quiet hours settings
    quiet_hours_enabled: bool | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None

    # Per-notification preferences (partial update)
    notification_settings: dict[str, dict[str, bool]] | None = None


class NotificationPreferencesResponse(NotificationPreferencesBase):
    """Schema for notification preferences response."""

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class QuietHoursUpdate(BaseSchema):
    """Schema for updating quiet hours only."""

    enabled: bool
    start: str = "22:00"
    end: str = "07:00"


class ChannelsUpdate(BaseSchema):
    """Schema for updating notification channels only."""

    email_enabled: bool | None = None
    push_enabled: bool | None = None
    sms_enabled: bool | None = None
    email_address: str | None = None
    phone_number: str | None = None


class NotificationSettingUpdate(BaseSchema):
    """Schema for updating a single notification type setting."""

    notification_key: str
    email: bool | None = None
    push: bool | None = None
    sms: bool | None = None
