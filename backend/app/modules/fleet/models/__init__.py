"""Fleet module models."""

from app.modules.fleet.models.fuel import FuelEntry
from app.modules.fleet.models.fuel_pump import FuelPump
from app.modules.fleet.models.fuel_pump_delivery import FuelPumpDelivery
from app.modules.fleet.models.gps import Geofence, GpsAlert, Trip, TripPosition
from app.modules.fleet.models.maintenance import MaintenanceSchedule, MaintenanceTask
from app.modules.fleet.models.ticket import Ticket
from app.modules.fleet.models.vehicle import Vehicle, VehicleGroup, VehicleGroupMember

__all__ = [
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
]
