"""Schemas module - backward compatibility hub.

Re-exports all schemas from their new locations in shared/ and modules/.
"""

# Shared schemas
from app.shared.schemas.auth import (  # noqa: F401
    EmployeePinChangeRequest,
    EmployeePinChangeResponse,
    EmployeePinLoginRequest,
    EmployeePinResetRequest,
    EmployeePinResetResponse,
    LoginRequest,
    MessagingChannelsResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenPayload,
    TokenResponse,
)
from app.shared.schemas.base import (  # noqa: F401
    BaseSchema,
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
)
from app.shared.schemas.cost_center import (  # noqa: F401
    BudgetSummary,
    CostAllocationCreate,
    CostAllocationResponse,
    CostAllocationUpdate,
    CostCenterCreate,
    CostCenterResponse,
    CostCenterSummary,
    CostCenterUpdate,
    CostCenterWithHierarchy,
)
from app.shared.schemas.dashboard import (  # noqa: F401
    AlertsSummary,
    DashboardAlerts,
    DashboardData,
    DashboardFleetStatus,
    DashboardStats,
    ExpiringDocument,
    FleetOverview,
    FuelSummary,
    MaintenanceSummary,
    RecentActivity,
    UpcomingMaintenance,
    VehicleStatusCount,
)
from app.shared.schemas.document import (  # noqa: F401
    DocumentCreate,
    DocumentResponse,
    DocumentSummary,
    DocumentUpdate,
)
from app.shared.schemas.employee import (  # noqa: F401
    EmployeeCreate,
    EmployeePerformance,
    EmployeeResponse,
    EmployeeSummary,
    EmployeeUpdate,
)
from app.shared.schemas.notification import (  # noqa: F401
    NotificationCreate,
    NotificationResponse,
    NotificationSummary,
    NotificationUpdate,
    UnreadCount,
)
from app.shared.schemas.notification_preferences import (  # noqa: F401
    DEFAULT_NOTIFICATION_SETTINGS,
    ChannelsUpdate,
    NotificationPreferencesCreate,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationSettingUpdate,
    QuietHoursUpdate,
)
from app.shared.schemas.organization import (  # noqa: F401
    OrganizationCreate,
    OrganizationResponse,
    OrganizationSummary,
    OrganizationUpdate,
)
from app.shared.schemas.user import (  # noqa: F401
    CurrentUser,
    UserCreate,
    UserPasswordUpdate,
    UserResponse,
    UserSummary,
    UserUpdate,
)

# Fleet module schemas
from app.modules.fleet.schemas.fuel import (  # noqa: F401
    FuelAnalytics,
    FuelEntryCreate,
    FuelEntryResponse,
    FuelEntrySummary,
    FuelEntryUpdate,
)
from app.modules.fleet.schemas.fuel_pump import (  # noqa: F401
    FuelPumpCreate,
    FuelPumpLevelAdjustment,
    FuelPumpResponse,
    FuelPumpSummary,
    FuelPumpUpdate,
)
from app.modules.fleet.schemas.fuel_pump_delivery import (  # noqa: F401
    FuelPumpDeliveryCreate,
    FuelPumpDeliveryResponse,
    FuelPumpDeliverySummary,
    FuelPumpDeliveryUpdate,
)
from app.modules.fleet.schemas.gps import (  # noqa: F401
    GeofenceCreate,
    GeofenceResponse,
    GeofenceUpdate,
    GpsAlertCreate,
    GpsAlertResponse,
    GpsAlertSummary,
    GpsAlertUpdate,
    TripCreate,
    TripPositionCreate,
    TripPositionResponse,
    TripPositionUpdate,
    TripResponse,
    TripSummary,
    TripUpdate,
)
from app.modules.fleet.schemas.maintenance import (  # noqa: F401
    MaintenanceScheduleCreate,
    MaintenanceScheduleResponse,
    MaintenanceScheduleUpdate,
    MaintenanceTaskCreate,
    MaintenanceTaskResponse,
    MaintenanceTaskSummary,
    MaintenanceTaskUpdate,
)
from app.modules.fleet.schemas.ticket import (  # noqa: F401
    TicketCreate,
    TicketPayRequest,
    TicketResponse,
    TicketStats,
    TicketSummary,
    TicketUpdate,
)
from app.modules.fleet.schemas.vehicle import (  # noqa: F401
    VehicleCreate,
    VehicleGroupCreate,
    VehicleGroupResponse,
    VehicleGroupUpdate,
    VehicleResponse,
    VehicleSummary,
    VehicleUpdate,
)

# Tool module schemas
from app.modules.tools.schemas.tool import (  # noqa: F401
    ToolCreate,
    ToolResponse,
    ToolSummary,
    ToolUpdate,
)
from app.modules.tools.schemas.tool_assignment import (  # noqa: F401
    ToolAssignmentCreate,
    ToolAssignmentResponse,
    ToolAssignmentReturn,
)
from app.modules.tools.schemas.tool_calibration import (  # noqa: F401
    ToolCalibrationCreate,
    ToolCalibrationResponse,
    ToolCalibrationUpdate,
)
from app.modules.tools.schemas.tool_case import (  # noqa: F401
    ToolCaseCreate,
    ToolCaseResponse,
    ToolCaseUpdate,
)
from app.modules.tools.schemas.tool_category import (  # noqa: F401
    ToolCategoryCreate,
    ToolCategoryResponse,
    ToolCategoryUpdate,
)
from app.modules.tools.schemas.tool_location import (  # noqa: F401
    ToolLocationCreate,
    ToolLocationResponse,
    ToolLocationUpdate,
)

__all__ = [
    # Base
    "BaseSchema",
    "PaginatedResponse",
    "MessageResponse",
    "ErrorResponse",
    # Auth
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "RegisterRequest",
    "TokenPayload",
    "EmployeePinLoginRequest",
    "EmployeePinResetRequest",
    "EmployeePinResetResponse",
    "EmployeePinChangeRequest",
    "EmployeePinChangeResponse",
    "MessagingChannelsResponse",
    # Organization
    "OrganizationCreate",
    "OrganizationUpdate",
    "OrganizationResponse",
    "OrganizationSummary",
    # User
    "UserCreate",
    "UserUpdate",
    "UserPasswordUpdate",
    "UserResponse",
    "UserSummary",
    "CurrentUser",
    # Vehicle
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleResponse",
    "VehicleSummary",
    "VehicleGroupCreate",
    "VehicleGroupUpdate",
    "VehicleGroupResponse",
    # Employee
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "EmployeeSummary",
    "EmployeePerformance",
    # Fuel
    "FuelEntryCreate",
    "FuelEntryUpdate",
    "FuelEntryResponse",
    "FuelEntrySummary",
    "FuelAnalytics",
    # Fuel Pump
    "FuelPumpCreate",
    "FuelPumpUpdate",
    "FuelPumpResponse",
    "FuelPumpSummary",
    "FuelPumpLevelAdjustment",
    # Fuel Pump Delivery
    "FuelPumpDeliveryCreate",
    "FuelPumpDeliveryUpdate",
    "FuelPumpDeliveryResponse",
    "FuelPumpDeliverySummary",
    # Maintenance
    "MaintenanceTaskCreate",
    "MaintenanceTaskUpdate",
    "MaintenanceTaskResponse",
    "MaintenanceTaskSummary",
    "MaintenanceScheduleCreate",
    "MaintenanceScheduleUpdate",
    "MaintenanceScheduleResponse",
    # Cost Center
    "CostCenterCreate",
    "CostCenterUpdate",
    "CostCenterResponse",
    "CostCenterSummary",
    "CostCenterWithHierarchy",
    "CostAllocationCreate",
    "CostAllocationUpdate",
    "CostAllocationResponse",
    "BudgetSummary",
    # GPS
    "TripCreate",
    "TripUpdate",
    "TripResponse",
    "TripSummary",
    "TripPositionCreate",
    "TripPositionUpdate",
    "TripPositionResponse",
    "GeofenceCreate",
    "GeofenceUpdate",
    "GeofenceResponse",
    "GpsAlertCreate",
    "GpsAlertUpdate",
    "GpsAlertResponse",
    "GpsAlertSummary",
    # Document
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "DocumentSummary",
    # Notification
    "NotificationCreate",
    "NotificationUpdate",
    "NotificationResponse",
    "NotificationSummary",
    "UnreadCount",
    # Notification Preferences
    "NotificationPreferencesCreate",
    "NotificationPreferencesUpdate",
    "NotificationPreferencesResponse",
    "ChannelsUpdate",
    "QuietHoursUpdate",
    "NotificationSettingUpdate",
    "DEFAULT_NOTIFICATION_SETTINGS",
    # Dashboard
    "FleetOverview",
    "FuelSummary",
    "MaintenanceSummary",
    "AlertsSummary",
    "VehicleStatusCount",
    "UpcomingMaintenance",
    "ExpiringDocument",
    "RecentActivity",
    "DashboardData",
    "DashboardFleetStatus",
    "DashboardStats",
    "DashboardAlerts",
    # Ticket
    "TicketCreate",
    "TicketUpdate",
    "TicketResponse",
    "TicketSummary",
    "TicketStats",
    "TicketPayRequest",
    # Tool
    "ToolCreate",
    "ToolUpdate",
    "ToolResponse",
    "ToolSummary",
    # Tool Category
    "ToolCategoryCreate",
    "ToolCategoryUpdate",
    "ToolCategoryResponse",
    # Tool Location
    "ToolLocationCreate",
    "ToolLocationUpdate",
    "ToolLocationResponse",
    # Tool Case
    "ToolCaseCreate",
    "ToolCaseUpdate",
    "ToolCaseResponse",
    # Tool Assignment
    "ToolAssignmentCreate",
    "ToolAssignmentReturn",
    "ToolAssignmentResponse",
    # Tool Calibration
    "ToolCalibrationCreate",
    "ToolCalibrationUpdate",
    "ToolCalibrationResponse",
]
