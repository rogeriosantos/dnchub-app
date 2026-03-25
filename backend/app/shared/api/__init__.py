"""Shared API routes."""

from fastapi import APIRouter

from app.shared.api import (
    auth,
    cost_centers,
    dashboard,
    documents,
    employees,
    notification_preferences,
    notifications,
    organizations,
    users,
)

shared_router = APIRouter()

shared_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
shared_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
shared_router.include_router(users.router, prefix="/users", tags=["Users"])
shared_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
shared_router.include_router(cost_centers.router, prefix="/cost-centers", tags=["Cost Centers"])
shared_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
shared_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
shared_router.include_router(notification_preferences.router, prefix="/notification-preferences", tags=["Notification Preferences"])
shared_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
