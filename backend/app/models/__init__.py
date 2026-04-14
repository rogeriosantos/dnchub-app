"""Models module - backward compatibility hub.

Re-exports all models from their new locations in shared/ and modules/.
"""

# Shared models
from app.shared.models.cost_center import CostAllocation, CostCenter
from app.shared.models.document import Document
from app.shared.models.employee import Employee
from app.shared.models.enums import (
    AlertSeverity,
    AlertType,
    AssistancePriority,
    AssistanceStatus,
    AttachmentFileType,
    AttachmentSource,
    BudgetPeriod,
    ConsumableStatus,
    ConsumableUnit,
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
    MachineType,
    MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType,
    NotificationPriority,
    NotificationType,
    PaymentMethod,
    PumpStatus,
    ReportStatus,
    SourceType,
    ThemePreference,
    TicketStatus,
    TicketType,
    ToolAssignmentType,
    ToolCondition,
    ToolStatus,
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

# Fleet module models
from app.modules.fleet.models.fuel import FuelEntry
from app.modules.fleet.models.fuel_pump import FuelPump
from app.modules.fleet.models.fuel_pump_delivery import FuelPumpDelivery
from app.modules.fleet.models.gps import Geofence, GpsAlert, Trip, TripPosition
from app.modules.fleet.models.maintenance import MaintenanceSchedule, MaintenanceTask
from app.modules.fleet.models.ticket import Ticket
from app.modules.fleet.models.vehicle import Vehicle, VehicleGroup, VehicleGroupMember

# SAT module models
from app.modules.sat.models.assistance import SatAssistance
from app.modules.sat.models.attachment import SatAttachment
from app.modules.sat.models.contact import SatContact
from app.modules.sat.models.customer import SatCustomer
from app.modules.sat.models.employee_specialization import SatEmployeeSpecialization
from app.modules.sat.models.intervention_report import SatInterventionReport
from app.modules.sat.models.machine import SatMachine
from app.modules.sat.models.service_type import SatServiceType
from app.modules.sat.models.specialization import SatSpecialization

# Tool module models
from app.modules.tools.models.consumable import Consumable
from app.modules.tools.models.tool import Tool
from app.modules.tools.models.tool_assignment import ToolAssignment
from app.modules.tools.models.tool_calibration import ToolCalibration
from app.modules.tools.models.tool_case import ToolCase
from app.modules.tools.models.tool_category import ToolCategory
from app.modules.tools.models.tool_location import ToolLocation

__all__ = [
    # Shared
    "Organization",
    "User",
    "Employee",
    "CostCenter",
    "CostAllocation",
    "Document",
    "Notification",
    "NotificationPreferences",
    # Fleet
    "Vehicle",
    "VehicleGroup",
    "VehicleGroupMember",
    "FuelEntry",
    "FuelPump",
    "FuelPumpDelivery",
    "MaintenanceTask",
    "MaintenanceSchedule",
    "Ticket",
    "Trip",
    "TripPosition",
    "Geofence",
    "GpsAlert",
    # Tools
    "Consumable",
    "Tool",
    "ToolAssignment",
    "ToolCalibration",
    "ToolCase",
    "ToolCategory",
    "ToolLocation",
    # SAT
    "SatAssistance",
    "SatAttachment",
    "SatContact",
    "SatCustomer",
    "SatEmployeeSpecialization",
    "SatInterventionReport",
    "SatMachine",
    "SatServiceType",
    "SatSpecialization",
    # Enums
    "AlertSeverity",
    "AlertType",
    "AssistancePriority",
    "AssistanceStatus",
    "AttachmentFileType",
    "AttachmentSource",
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
    "MachineType",
    "MaintenancePriority",
    "MaintenanceStatus",
    "MaintenanceType",
    "NotificationPriority",
    "NotificationType",
    "PaymentMethod",
    "PumpStatus",
    "ReportStatus",
    "SourceType",
    "ThemePreference",
    "TicketStatus",
    "TicketType",
    "ToolAssignmentType",
    "ToolCondition",
    "ToolStatus",
    "TripStatus",
    "UserRole",
    "VehicleStatus",
    "VehicleType",
    "VolumeUnit",
]
