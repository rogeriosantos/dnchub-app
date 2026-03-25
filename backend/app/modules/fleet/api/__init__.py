"""Fleet module API routes."""

from fastapi import APIRouter

from app.modules.fleet.api import (
    fuel,
    fuel_pump_deliveries,
    fuel_pumps,
    gps,
    maintenance,
    tickets,
    vehicles,
)

fleet_router = APIRouter()

fleet_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])
fleet_router.include_router(fuel.router, prefix="/fuel", tags=["Fuel"])
fleet_router.include_router(fuel_pumps.router, prefix="/fuel-pumps", tags=["Fuel Pumps"])
fleet_router.include_router(fuel_pump_deliveries.router, prefix="/fuel-pump-deliveries", tags=["Fuel Pump Deliveries"])
fleet_router.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance"])
fleet_router.include_router(gps.router, prefix="/gps", tags=["GPS & Trips"])
fleet_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
