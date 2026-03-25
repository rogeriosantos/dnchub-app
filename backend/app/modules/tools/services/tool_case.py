"""Tool case service."""

from app.modules.tools.models.tool_case import ToolCase
from app.modules.tools.schemas.tool_case import ToolCaseCreate, ToolCaseUpdate
from app.shared.services.base import BaseService


class ToolCaseService(BaseService[ToolCase, ToolCaseCreate, ToolCaseUpdate]):
    """Tool case service with CRUD operations."""

    def __init__(self):
        super().__init__(ToolCase)


tool_case_service = ToolCaseService()
