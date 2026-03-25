"""Enum types for database models."""

from enum import Enum


class VehicleStatus(str, Enum):
    """Vehicle status enumeration."""

    ACTIVE = "active"
    IN_MAINTENANCE = "in_maintenance"
    INACTIVE = "inactive"
    OUT_OF_SERVICE = "out_of_service"
    IN_TRANSIT = "in_transit"
    IDLE = "idle"


class VehicleType(str, Enum):
    """Vehicle type enumeration."""

    SEDAN = "sedan"
    SUV = "suv"
    TRUCK = "truck"
    VAN = "van"
    PICKUP = "pickup"
    MOTORCYCLE = "motorcycle"
    BUS = "bus"
    HEAVY_TRUCK = "heavy_truck"
    TRAILER = "trailer"


class FuelType(str, Enum):
    """Fuel type enumeration."""

    DIESEL = "diesel"
    PETROL = "petrol"
    GASOLINE = "gasoline"
    ELECTRIC = "electric"
    HYBRID = "hybrid"
    LPG = "lpg"
    CNG = "cng"


class EmployeeStatus(str, Enum):
    """Employee status enumeration."""

    AVAILABLE = "available"
    ON_DUTY = "on_duty"
    OFF_DUTY = "off_duty"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"
    ON_BREAK = "on_break"
    ON_TRIP = "on_trip"


class MaintenanceStatus(str, Enum):
    """Maintenance task status enumeration."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class MaintenancePriority(str, Enum):
    """Maintenance task priority enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MaintenanceType(str, Enum):
    """Maintenance type enumeration."""

    PREVENTIVE = "preventive"
    CORRECTIVE = "corrective"
    INSPECTION = "inspection"
    RECALL = "recall"
    EMERGENCY = "emergency"
    OIL_CHANGE = "oil_change"
    TIRE_ROTATION = "tire_rotation"
    BRAKE_SERVICE = "brake_service"
    ENGINE_SERVICE = "engine_service"
    TRANSMISSION_SERVICE = "transmission_service"


class IntervalType(str, Enum):
    """Maintenance interval type enumeration."""

    MILEAGE = "mileage"
    TIME = "time"
    BOTH = "both"


class DocumentStatus(str, Enum):
    """Document status enumeration."""

    VALID = "valid"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    PENDING = "pending"
    REJECTED = "rejected"


class DocumentType(str, Enum):
    """Document type enumeration."""

    REGISTRATION = "registration"
    INSURANCE = "insurance"
    LICENSE = "license"
    PERMIT = "permit"
    INSPECTION = "inspection"
    CONTRACT = "contract"
    OTHER = "other"


class EntityType(str, Enum):
    """Entity type enumeration for polymorphic relationships."""

    VEHICLE = "vehicle"
    EMPLOYEE = "employee"
    ORGANIZATION = "organization"


class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    OPERATOR = "operator"
    VIEWER = "viewer"
    TECHNICIAN = "technician"


class DistanceUnit(str, Enum):
    """Distance unit enumeration."""

    KM = "km"
    MI = "mi"


class VolumeUnit(str, Enum):
    """Volume unit enumeration."""

    L = "l"
    GAL = "gal"


class FuelEfficiencyFormat(str, Enum):
    """Fuel efficiency display format enumeration."""

    KM_PER_L = "km/l"
    L_PER_100KM = "l/100km"
    MPG = "mpg"


class BudgetPeriod(str, Enum):
    """Budget period enumeration."""

    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class SourceType(str, Enum):
    """Cost allocation source type enumeration."""

    FUEL = "fuel"
    MAINTENANCE = "maintenance"
    INSURANCE = "insurance"
    REGISTRATION = "registration"
    OTHER = "other"


# Alias for backward compatibility
CostType = SourceType


class GeofenceType(str, Enum):
    """Geofence type enumeration."""

    CIRCLE = "circle"
    POLYGON = "polygon"


class AlertType(str, Enum):
    """GPS alert type enumeration."""

    SPEEDING = "speeding"
    GEOFENCE_ENTRY = "geofence_entry"
    GEOFENCE_EXIT = "geofence_exit"
    HARSH_BRAKING = "harsh_braking"
    HARSH_ACCELERATION = "harsh_acceleration"
    IDLE = "idle"


class AlertSeverity(str, Enum):
    """Alert severity enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationType(str, Enum):
    """Notification type enumeration."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


class NotificationPriority(str, Enum):
    """Notification priority enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TripStatus(str, Enum):
    """Trip status enumeration."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TicketType(str, Enum):
    """Ticket/violation type enumeration."""

    SPEED = "speed"
    PARKING = "parking"
    TOLL = "toll"
    RED_LIGHT = "red_light"
    OTHER = "other"


class TicketStatus(str, Enum):
    """Ticket status enumeration."""

    PENDING = "pending"
    PAID = "paid"
    APPEALED = "appealed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class PaymentMethod(str, Enum):
    """Payment method enumeration."""

    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    OTHER = "other"


class PumpStatus(str, Enum):
    """Fuel pump status enumeration."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_of_service"


class ThemePreference(str, Enum):
    """User theme preference enumeration."""

    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class DateFormatPreference(str, Enum):
    """User date format preference enumeration."""

    MDY = "MM/DD/YYYY"
    DMY = "DD/MM/YYYY"
    YMD = "YYYY-MM-DD"


class ToolStatus(str, Enum):
    """Tool/case status enumeration."""

    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_REPAIR = "in_repair"
    IN_CALIBRATION = "in_calibration"
    LOST = "lost"
    RETIRED = "retired"


class ToolCondition(str, Enum):
    """Tool/case condition enumeration."""

    NEW = "new"
    GOOD = "good"
    FAIR = "fair"
    NEEDS_REPAIR = "needs_repair"
    DAMAGED = "damaged"


class ToolAssignmentType(str, Enum):
    """Tool assignment target type enumeration."""

    EMPLOYEE = "employee"
    VEHICLE = "vehicle"
    DEPARTMENT = "department"
    SECTION = "section"
    LOCATION = "location"
