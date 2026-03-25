"""API v1 module - aggregates shared and module routers."""

from fastapi import APIRouter

from app.shared.api import shared_router
from app.modules.fleet.api import fleet_router
from app.modules.tools.api import tools_router

api_router = APIRouter()

# Include shared routes (auth, users, organizations, drivers, etc.)
api_router.include_router(shared_router)

# Include fleet module routes (vehicles, fuel, maintenance, GPS, tickets)
api_router.include_router(fleet_router)

# Include tools module routes (tools, cases, categories, locations, assignments, calibrations)
api_router.include_router(tools_router)
