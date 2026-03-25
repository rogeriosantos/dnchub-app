"""Tool management module API routes."""

from fastapi import APIRouter

from app.modules.tools.api import (
    tool_calibrations,
    tool_cases,
    tool_categories,
    tool_locations,
    tools,
    tool_assignments,
)

tools_router = APIRouter()

tools_router.include_router(tool_categories.router, prefix="/tool-categories", tags=["Tool Categories"])
tools_router.include_router(tool_locations.router, prefix="/tool-locations", tags=["Tool Locations"])
tools_router.include_router(tool_cases.router, prefix="/tool-cases", tags=["Tool Cases"])
tools_router.include_router(tools.router, prefix="/tools", tags=["Tools"])
tools_router.include_router(tool_assignments.router, prefix="/tool-assignments", tags=["Tool Assignments"])
tools_router.include_router(tool_calibrations.router, prefix="/tool-calibrations", tags=["Tool Calibrations"])
