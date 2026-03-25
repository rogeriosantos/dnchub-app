"""Tool calibration service."""

from app.modules.tools.models.tool_calibration import ToolCalibration
from app.modules.tools.schemas.tool_calibration import ToolCalibrationCreate, ToolCalibrationUpdate
from app.shared.services.base import BaseService


class ToolCalibrationService(BaseService[ToolCalibration, ToolCalibrationCreate, ToolCalibrationUpdate]):
    """Tool calibration service with CRUD operations."""

    def __init__(self):
        super().__init__(ToolCalibration)


tool_calibration_service = ToolCalibrationService()
