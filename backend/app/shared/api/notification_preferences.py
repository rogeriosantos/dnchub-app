"""Notification Preferences endpoints."""

from fastapi import APIRouter

from app.shared.api.deps import CurrentUserDep, DBDep
from app.shared.schemas.notification_preferences import (
    ChannelsUpdate,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationSettingUpdate,
    QuietHoursUpdate,
)
from app.services import notification_preferences_service

router = APIRouter()


@router.get("", response_model=NotificationPreferencesResponse)
def get_preferences(
    db: DBDep,
    current_user: CurrentUserDep,
) -> NotificationPreferencesResponse:
    """Get notification preferences for the current user.

    Creates default preferences if none exist.
    """
    prefs = notification_preferences_service.get_or_create(
        db,
        user_id=current_user.id,
        email_address=current_user.email,
        phone_number=current_user.phone,
    )
    return NotificationPreferencesResponse.model_validate(prefs)


@router.put("", response_model=NotificationPreferencesResponse)
def update_preferences(
    data: NotificationPreferencesUpdate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> NotificationPreferencesResponse:
    """Update notification preferences for the current user."""
    prefs = notification_preferences_service.get_or_create(
        db,
        user_id=current_user.id,
        email_address=current_user.email,
        phone_number=current_user.phone,
    )
    updated = notification_preferences_service.update(db, prefs, data)
    return NotificationPreferencesResponse.model_validate(updated)


@router.put("/channels", response_model=NotificationPreferencesResponse)
def update_channels(
    data: ChannelsUpdate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> NotificationPreferencesResponse:
    """Update notification channel settings only."""
    prefs = notification_preferences_service.get_or_create(
        db,
        user_id=current_user.id,
        email_address=current_user.email,
        phone_number=current_user.phone,
    )
    updated = notification_preferences_service.update_channels(
        db,
        prefs,
        email_enabled=data.email_enabled,
        push_enabled=data.push_enabled,
        sms_enabled=data.sms_enabled,
        email_address=data.email_address,
        phone_number=data.phone_number,
    )
    return NotificationPreferencesResponse.model_validate(updated)


@router.put("/quiet-hours", response_model=NotificationPreferencesResponse)
def update_quiet_hours(
    data: QuietHoursUpdate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> NotificationPreferencesResponse:
    """Update quiet hours settings."""
    prefs = notification_preferences_service.get_or_create(
        db,
        user_id=current_user.id,
        email_address=current_user.email,
        phone_number=current_user.phone,
    )
    updated = notification_preferences_service.update_quiet_hours(
        db,
        prefs,
        enabled=data.enabled,
        start=data.start,
        end=data.end,
    )
    return NotificationPreferencesResponse.model_validate(updated)


@router.put("/setting", response_model=NotificationPreferencesResponse)
def update_notification_setting(
    data: NotificationSettingUpdate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> NotificationPreferencesResponse:
    """Update a single notification type setting."""
    prefs = notification_preferences_service.get_or_create(
        db,
        user_id=current_user.id,
        email_address=current_user.email,
        phone_number=current_user.phone,
    )
    updated = notification_preferences_service.update_notification_setting(
        db,
        prefs,
        notification_key=data.notification_key,
        email=data.email,
        push=data.push,
        sms=data.sms,
    )
    return NotificationPreferencesResponse.model_validate(updated)


@router.post("/reset", response_model=NotificationPreferencesResponse)
def reset_to_defaults(
    db: DBDep,
    current_user: CurrentUserDep,
) -> NotificationPreferencesResponse:
    """Reset all notification preferences to defaults."""
    prefs = notification_preferences_service.get_or_create(
        db,
        user_id=current_user.id,
        email_address=current_user.email,
        phone_number=current_user.phone,
    )
    updated = notification_preferences_service.reset_to_defaults(db, prefs)
    return NotificationPreferencesResponse.model_validate(updated)
