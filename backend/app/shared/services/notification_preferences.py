"""Notification Preferences service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import NotificationPreferences
from app.shared.schemas.notification_preferences import (
    DEFAULT_NOTIFICATION_SETTINGS,
    NotificationPreferencesCreate,
    NotificationPreferencesUpdate,
)


class NotificationPreferencesService:
    """Notification Preferences service."""

    def get_by_user_id(
        self,
        db: Session,
        user_id: str,
    ) -> NotificationPreferences | None:
        """Get notification preferences by user ID."""
        result = db.execute(
            select(NotificationPreferences).where(
                NotificationPreferences.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    def get_or_create(
        self,
        db: Session,
        user_id: str,
        email_address: str | None = None,
        phone_number: str | None = None,
    ) -> NotificationPreferences:
        """Get existing preferences or create default ones for a user."""
        prefs = self.get_by_user_id(db, user_id)
        if prefs:
            return prefs

        # Create default preferences
        prefs = NotificationPreferences(
            user_id=user_id,
            email_enabled=True,
            push_enabled=True,
            sms_enabled=False,
            email_address=email_address,
            phone_number=phone_number,
            quiet_hours_enabled=False,
            quiet_hours_start="22:00",
            quiet_hours_end="07:00",
            notification_settings=DEFAULT_NOTIFICATION_SETTINGS.copy(),
        )
        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs

    def create(
        self,
        db: Session,
        user_id: str,
        data: NotificationPreferencesCreate,
    ) -> NotificationPreferences:
        """Create notification preferences for a user."""
        prefs = NotificationPreferences(
            user_id=user_id,
            email_enabled=data.email_enabled,
            push_enabled=data.push_enabled,
            sms_enabled=data.sms_enabled,
            email_address=data.email_address,
            phone_number=data.phone_number,
            quiet_hours_enabled=data.quiet_hours_enabled,
            quiet_hours_start=data.quiet_hours_start,
            quiet_hours_end=data.quiet_hours_end,
            notification_settings=data.notification_settings or DEFAULT_NOTIFICATION_SETTINGS.copy(),
        )
        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs

    def update(
        self,
        db: Session,
        prefs: NotificationPreferences,
        data: NotificationPreferencesUpdate,
    ) -> NotificationPreferences:
        """Update notification preferences."""
        update_data = data.model_dump(exclude_unset=True)

        # Handle notification_settings merge (partial update)
        if "notification_settings" in update_data and update_data["notification_settings"]:
            current_settings = dict(prefs.notification_settings) if prefs.notification_settings else {}
            for key, value in update_data["notification_settings"].items():
                if key in current_settings:
                    current_settings[key].update(value)
                else:
                    current_settings[key] = value
            update_data["notification_settings"] = current_settings

        for field, value in update_data.items():
            setattr(prefs, field, value)

        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs

    def update_channels(
        self,
        db: Session,
        prefs: NotificationPreferences,
        email_enabled: bool | None = None,
        push_enabled: bool | None = None,
        sms_enabled: bool | None = None,
        email_address: str | None = None,
        phone_number: str | None = None,
    ) -> NotificationPreferences:
        """Update only channel settings."""
        if email_enabled is not None:
            prefs.email_enabled = email_enabled
        if push_enabled is not None:
            prefs.push_enabled = push_enabled
        if sms_enabled is not None:
            prefs.sms_enabled = sms_enabled
        if email_address is not None:
            prefs.email_address = email_address
        if phone_number is not None:
            prefs.phone_number = phone_number

        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs

    def update_quiet_hours(
        self,
        db: Session,
        prefs: NotificationPreferences,
        enabled: bool,
        start: str | None = None,
        end: str | None = None,
    ) -> NotificationPreferences:
        """Update quiet hours settings."""
        prefs.quiet_hours_enabled = enabled
        if start is not None:
            prefs.quiet_hours_start = start
        if end is not None:
            prefs.quiet_hours_end = end

        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs

    def update_notification_setting(
        self,
        db: Session,
        prefs: NotificationPreferences,
        notification_key: str,
        email: bool | None = None,
        push: bool | None = None,
        sms: bool | None = None,
    ) -> NotificationPreferences:
        """Update a single notification type setting."""
        current_settings = dict(prefs.notification_settings) if prefs.notification_settings else {}

        if notification_key not in current_settings:
            current_settings[notification_key] = {"email": True, "push": True, "sms": False}

        if email is not None:
            current_settings[notification_key]["email"] = email
        if push is not None:
            current_settings[notification_key]["push"] = push
        if sms is not None:
            current_settings[notification_key]["sms"] = sms

        prefs.notification_settings = current_settings

        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs

    def reset_to_defaults(
        self,
        db: Session,
        prefs: NotificationPreferences,
    ) -> NotificationPreferences:
        """Reset all notification settings to defaults."""
        prefs.email_enabled = True
        prefs.push_enabled = True
        prefs.sms_enabled = False
        prefs.quiet_hours_enabled = False
        prefs.quiet_hours_start = "22:00"
        prefs.quiet_hours_end = "07:00"
        prefs.notification_settings = DEFAULT_NOTIFICATION_SETTINGS.copy()

        db.add(prefs)
        db.flush()
        db.refresh(prefs)
        return prefs


notification_preferences_service = NotificationPreferencesService()
