"""Shared services."""

from app.shared.services.auth import auth_service
from app.shared.services.cost_center import cost_allocation_service, cost_center_service
from app.shared.services.dashboard import dashboard_service
from app.shared.services.document import document_service
from app.shared.services.employee import employee_service
from app.shared.services.messaging import messaging_service
from app.shared.services.notification import notification_service
from app.shared.services.notification_preferences import notification_preferences_service
from app.shared.services.organization import organization_service
from app.shared.services.user import user_service

__all__ = [
    "auth_service",
    "organization_service",
    "user_service",
    "employee_service",
    "cost_center_service",
    "cost_allocation_service",
    "document_service",
    "messaging_service",
    "notification_service",
    "notification_preferences_service",
    "dashboard_service",
]
