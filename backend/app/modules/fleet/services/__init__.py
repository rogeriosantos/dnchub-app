"""Fleet module services."""

from app.modules.fleet.services.fuel import fuel_service
from app.modules.fleet.services.fuel_pump import fuel_pump_service
from app.modules.fleet.services.fuel_pump_delivery import fuel_pump_delivery_service
from app.modules.fleet.services.gps import (
    geofence_service,
    gps_alert_service,
    trip_position_service,
    trip_service,
)
from app.modules.fleet.services.maintenance import (
    maintenance_schedule_service,
    maintenance_task_service,
)
from app.modules.fleet.services.ticket import ticket_service
from app.modules.fleet.services.vehicle import vehicle_group_service, vehicle_service

__all__ = [
    "vehicle_service",
    "vehicle_group_service",
    "fuel_service",
    "fuel_pump_service",
    "fuel_pump_delivery_service",
    "maintenance_task_service",
    "maintenance_schedule_service",
    "trip_service",
    "trip_position_service",
    "geofence_service",
    "gps_alert_service",
    "ticket_service",
]
