"""Tool location service."""

from app.modules.tools.models.tool_location import ToolLocation
from app.modules.tools.schemas.tool_location import ToolLocationCreate, ToolLocationUpdate
from app.shared.services.base import BaseService


class ToolLocationService(BaseService[ToolLocation, ToolLocationCreate, ToolLocationUpdate]):
    """Tool location service with CRUD operations."""

    def __init__(self):
        super().__init__(ToolLocation)


tool_location_service = ToolLocationService()
