"""Shared schemas."""

from app.shared.schemas.auth import (
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
from app.shared.schemas.base import (
    BaseSchema,
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
)
from app.shared.schemas.cost_center import (
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
from app.shared.schemas.dashboard import (
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
from app.shared.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentSummary,
    DocumentUpdate,
)
from app.shared.schemas.employee import (
    EmployeeCreate,
    EmployeePerformance,
    EmployeeResponse,
    EmployeeSummary,
    EmployeeUpdate,
)
from app.shared.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationSummary,
    NotificationUpdate,
    UnreadCount,
)
from app.shared.schemas.notification_preferences import (
    DEFAULT_NOTIFICATION_SETTINGS,
    ChannelsUpdate,
    NotificationPreferencesCreate,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationSettingUpdate,
    QuietHoursUpdate,
)
from app.shared.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationSummary,
    OrganizationUpdate,
)
from app.shared.schemas.user import (
    CurrentUser,
    UserCreate,
    UserPasswordUpdate,
    UserResponse,
    UserSummary,
    UserUpdate,
)
