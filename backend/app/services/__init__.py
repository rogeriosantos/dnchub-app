"""Service layer - backward compatibility hub.

Re-exports all services from their new locations in shared/ and modules/.
"""

# Shared services
from app.shared.services.auth import auth_service  # noqa: F401
from app.shared.services.cost_center import cost_allocation_service, cost_center_service  # noqa: F401
from app.shared.services.dashboard import dashboard_service  # noqa: F401
from app.shared.services.document import document_service  # noqa: F401
from app.shared.services.employee import employee_service  # noqa: F401
from app.shared.services.messaging import messaging_service  # noqa: F401
from app.shared.services.notification import notification_service  # noqa: F401
from app.shared.services.notification_preferences import notification_preferences_service  # noqa: F401
from app.shared.services.organization import organization_service  # noqa: F401
from app.shared.services.user import user_service  # noqa: F401

# Fleet module services
from app.modules.fleet.services.fuel import fuel_service  # noqa: F401
from app.modules.fleet.services.fuel_pump import fuel_pump_service  # noqa: F401
from app.modules.fleet.services.fuel_pump_delivery import fuel_pump_delivery_service  # noqa: F401
from app.modules.fleet.services.gps import (  # noqa: F401
    geofence_service,
    gps_alert_service,
    trip_position_service,
    trip_service,
)
from app.modules.fleet.services.maintenance import (  # noqa: F401
    maintenance_schedule_service,
    maintenance_task_service,
)
from app.modules.fleet.services.ticket import ticket_service  # noqa: F401
from app.modules.fleet.services.vehicle import vehicle_group_service, vehicle_service  # noqa: F401

# Tool module services
from app.modules.tools.services.consumable import consumable_service  # noqa: F401
from app.modules.tools.services.tool import tool_service  # noqa: F401
from app.modules.tools.services.tool_assignment import tool_assignment_service  # noqa: F401
from app.modules.tools.services.tool_calibration import tool_calibration_service  # noqa: F401
from app.modules.tools.services.tool_case import tool_case_service  # noqa: F401
from app.modules.tools.services.tool_category import tool_category_service  # noqa: F401
from app.modules.tools.services.tool_location import tool_location_service  # noqa: F401

__all__ = [
    "auth_service",
    "organization_service",
    "user_service",
    "vehicle_service",
    "vehicle_group_service",
    "employee_service",
    "fuel_service",
    "fuel_pump_service",
    "fuel_pump_delivery_service",
    "maintenance_task_service",
    "maintenance_schedule_service",
    "cost_center_service",
    "cost_allocation_service",
    "trip_service",
    "trip_position_service",
    "geofence_service",
    "gps_alert_service",
    "document_service",
    "messaging_service",
    "notification_service",
    "notification_preferences_service",
    "dashboard_service",
    "ticket_service",
    "consumable_service",
    "tool_service",
    "tool_category_service",
    "tool_location_service",
    "tool_case_service",
    "tool_assignment_service",
    "tool_calibration_service",
]
