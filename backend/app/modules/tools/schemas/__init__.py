"""Tool management module schemas."""

from app.modules.tools.schemas.consumable import (
    ConsumableAdjustQuantity,
    ConsumableCreate,
    ConsumableResponse,
    ConsumableSummary,
    ConsumableUpdate,
)
from app.modules.tools.schemas.tool import (
    ToolCreate,
    ToolResponse,
    ToolSummary,
    ToolUpdate,
)
from app.modules.tools.schemas.tool_assignment import (
    ToolAssignmentCreate,
    ToolAssignmentResponse,
    ToolAssignmentReturn,
)
from app.modules.tools.schemas.tool_calibration import (
    ToolCalibrationCreate,
    ToolCalibrationResponse,
    ToolCalibrationUpdate,
)
from app.modules.tools.schemas.tool_case import (
    ToolCaseCreate,
    ToolCaseResponse,
    ToolCaseUpdate,
)
from app.modules.tools.schemas.tool_category import (
    ToolCategoryCreate,
    ToolCategoryResponse,
    ToolCategoryUpdate,
)
from app.modules.tools.schemas.tool_location import (
    ToolLocationCreate,
    ToolLocationResponse,
    ToolLocationUpdate,
)

__all__ = [
    # Consumable
    "ConsumableCreate",
    "ConsumableUpdate",
    "ConsumableResponse",
    "ConsumableSummary",
    "ConsumableAdjustQuantity",
    # Tool
    "ToolCreate",
    "ToolUpdate",
    "ToolResponse",
    "ToolSummary",
    # Tool Category
    "ToolCategoryCreate",
    "ToolCategoryUpdate",
    "ToolCategoryResponse",
    # Tool Location
    "ToolLocationCreate",
    "ToolLocationUpdate",
    "ToolLocationResponse",
    # Tool Case
    "ToolCaseCreate",
    "ToolCaseUpdate",
    "ToolCaseResponse",
    # Tool Assignment
    "ToolAssignmentCreate",
    "ToolAssignmentReturn",
    "ToolAssignmentResponse",
    # Tool Calibration
    "ToolCalibrationCreate",
    "ToolCalibrationUpdate",
    "ToolCalibrationResponse",
]
