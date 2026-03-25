"""Notification service."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import Notification
from app.models.enums import NotificationType
from app.schemas import NotificationCreate, NotificationUpdate
from app.shared.services.base import BaseService


class NotificationService(BaseService[Notification, NotificationCreate, NotificationUpdate]):
    """Notification service."""

    def __init__(self):
        super().__init__(Notification)

    def create_notification(
        self,
        db: Session,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        link: str | None = None,
    ) -> Notification:
        """Create a notification."""
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
            is_read=False,
        )
        db.add(notification)
        db.flush()
        db.refresh(notification)
        return notification

    def get_user_notifications(
        self,
        db: Session,
        user_id: str,
        *,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Notification]:
        """Get notifications for a user."""
        query = select(Notification).where(
            Notification.user_id == user_id,
        )

        if unread_only:
            query = query.where(Notification.is_read == False)

        result = db.execute(
            query.order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def get_unread_count(
        self,
        db: Session,
        user_id: str,
    ) -> int:
        """Get count of unread notifications."""
        result = db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        return result.scalar() or 0

    def mark_as_read(
        self,
        db: Session,
        notification: Notification,
    ) -> Notification:
        """Mark a notification as read."""
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.add(notification)
        db.flush()
        db.refresh(notification)
        return notification

    def mark_all_as_read(
        self,
        db: Session,
        user_id: str,
    ) -> int:
        """Mark all notifications as read for a user. Returns count of updated."""
        result = db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        notifications = result.scalars().all()

        now = datetime.now(timezone.utc)
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
            db.add(notification)

        db.flush()
        return len(notifications)

    def get_notifications_by_type(
        self,
        db: Session,
        user_id: str,
        notification_type: NotificationType,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Notification]:
        """Get notifications by type."""
        result = db.execute(
            select(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.type == notification_type,
            )
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def get_high_priority_notifications(
        self,
        db: Session,
        user_id: str,
    ) -> list[Notification]:
        """Get unread warning and error notifications."""
        result = db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
                Notification.type.in_([
                    NotificationType.WARNING,
                    NotificationType.ERROR,
                ]),
            )
            .order_by(Notification.created_at.desc())
        )
        return list(result.scalars().all())

    def delete_old_notifications(
        self,
        db: Session,
        user_id: str,
        days_old: int = 90,
    ) -> int:
        """Hard delete notifications older than specified days. Returns count deleted."""
        threshold = datetime.now(timezone.utc) - timedelta(days=days_old)

        result = db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.created_at < threshold,
            )
        )
        notifications = result.scalars().all()
        count = len(notifications)

        for notification in notifications:
            db.delete(notification)

        db.flush()
        return count


notification_service = NotificationService()
