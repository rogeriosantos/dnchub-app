"""Tool category service."""

from app.modules.tools.models.tool_category import ToolCategory
from app.modules.tools.schemas.tool_category import ToolCategoryCreate, ToolCategoryUpdate
from app.shared.services.base import BaseService


class ToolCategoryService(BaseService[ToolCategory, ToolCategoryCreate, ToolCategoryUpdate]):
    """Tool category service with CRUD operations."""

    def __init__(self):
        super().__init__(ToolCategory)


tool_category_service = ToolCategoryService()
