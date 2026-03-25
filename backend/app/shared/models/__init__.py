"""Shared models - cross-module entities."""

from app.shared.models.cost_center import CostAllocation, CostCenter
from app.shared.models.document import Document
from app.shared.models.employee import Employee
from app.shared.models.enums import (
    AlertSeverity,
    AlertType,
    BudgetPeriod,
    DateFormatPreference,
    DistanceUnit,
    DocumentStatus,
    DocumentType,
    EmployeeStatus,
    EntityType,
    FuelEfficiencyFormat,
    FuelType,
    GeofenceType,
    IntervalType,
    MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType,
    NotificationPriority,
    NotificationType,
    PaymentMethod,
    PumpStatus,
    SourceType,
    ThemePreference,
    TicketStatus,
    TicketType,
    TripStatus,
    UserRole,
    VehicleStatus,
    VehicleType,
    VolumeUnit,
)
from app.shared.models.notification import Notification
from app.shared.models.notification_preferences import NotificationPreferences
from app.shared.models.organization import Organization
from app.shared.models.user import User

__all__ = [
    # Core
    "Organization",
    "User",
    "Employee",
    # Supporting
    "CostCenter",
    "CostAllocation",
    "Document",
    "Notification",
    "NotificationPreferences",
    # All enums
    "AlertSeverity",
    "AlertType",
    "BudgetPeriod",
    "DateFormatPreference",
    "DistanceUnit",
    "DocumentStatus",
    "DocumentType",
    "EmployeeStatus",
    "EntityType",
    "FuelEfficiencyFormat",
    "FuelType",
    "GeofenceType",
    "IntervalType",
    "MaintenancePriority",
    "MaintenanceStatus",
    "MaintenanceType",
    "NotificationPriority",
    "NotificationType",
    "PaymentMethod",
    "PumpStatus",
    "SourceType",
    "ThemePreference",
    "TicketStatus",
    "TicketType",
    "TripStatus",
    "UserRole",
    "VehicleStatus",
    "VehicleType",
    "VolumeUnit",
]
