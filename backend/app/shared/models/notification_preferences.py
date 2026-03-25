"""Notification Preferences model."""

from sqlalchemy import Boolean, ForeignKey, String, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class NotificationPreferences(Base, UUIDMixin, TimestampMixin):
    """Notification Preferences model - user notification settings."""

    __tablename__ = "notification_preferences"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Channel settings
    email_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    push_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Contact info
    email_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Quiet hours settings
    quiet_hours_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quiet_hours_start: Mapped[str | None] = mapped_column(String(5), nullable=True, default="22:00")
    quiet_hours_end: Mapped[str | None] = mapped_column(String(5), nullable=True, default="07:00")

    # Per-notification preferences stored as JSON
    # Format: { "notification_key": { "email": true, "push": true, "sms": false }, ... }
    notification_settings: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    # Relationships
    user: Mapped["User"] = relationship(  # type: ignore[name-defined]
        back_populates="notification_preferences",
    )

    def __repr__(self) -> str:
        return f"<NotificationPreferences(id={self.id}, user_id={self.user_id})>"
