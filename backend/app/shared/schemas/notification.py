"""Notification schemas."""

from datetime import datetime

from pydantic import Field

from app.shared.models.enums import NotificationType
from app.shared.schemas.base import BaseSchema, TimestampMixin


class NotificationBase(BaseSchema):
    """Base notification schema."""

    type: NotificationType
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    link: str | None = Field(None, max_length=500)


class NotificationCreate(NotificationBase):
    """Notification creation schema."""

    user_id: str


class NotificationUpdate(BaseSchema):
    """Notification update schema."""

    is_read: bool | None = None


class NotificationResponse(NotificationBase, TimestampMixin):
    """Notification response schema."""

    id: str
    user_id: str
    is_read: bool = False
    read_at: datetime | None = None


class NotificationSummary(BaseSchema):
    """Notification summary for lists."""

    id: str
    type: NotificationType
    title: str
    is_read: bool
    created_at: datetime


class UnreadCount(BaseSchema):
    """Unread notification count."""

    count: int
