"""Cost center schemas."""

from datetime import date as dt_date
from decimal import Decimal

from pydantic import Field

from app.shared.models.enums import BudgetPeriod, SourceType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class CostCenterBase(BaseSchema):
    """Base cost center schema."""

    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    budget: Decimal | None = Field(None, ge=0)
    budget_period: BudgetPeriod | None = None
    is_active: bool = True


class CostCenterCreate(CostCenterBase):
    """Cost center creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    parent_id: str | None = None
    manager_id: str | None = None


class CostCenterUpdate(BaseSchema):
    """Cost center update schema."""

    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    parent_id: str | None = None
    budget: Decimal | None = Field(None, ge=0)
    budget_period: BudgetPeriod | None = None
    is_active: bool | None = None
    manager_id: str | None = None


class CostCenterResponse(CostCenterBase, TimestampMixin, SoftDeleteMixin):
    """Cost center response schema."""

    id: str
    organization_id: str
    parent_id: str | None = None
    manager_id: str | None = None
    current_spend: Decimal = Decimal("0")

    @property
    def budget_utilization(self) -> Decimal | None:
        """Calculate budget utilization percentage."""
        if self.budget and self.budget > 0:
            return (self.current_spend / self.budget) * 100
        return None


class CostCenterSummary(BaseSchema):
    """Cost center summary for nested responses."""

    id: str
    code: str
    name: str
    is_active: bool


class CostCenterWithHierarchy(CostCenterResponse):
    """Cost center with children hierarchy."""

    children: list["CostCenterWithHierarchy"] = []


class CostAllocationBase(BaseSchema):
    """Base cost allocation schema."""

    source_type: SourceType
    source_id: str
    amount: Decimal = Field(..., gt=0)
    date: dt_date
    description: str | None = Field(None, max_length=500)


class CostAllocationCreate(CostAllocationBase):
    """Cost allocation creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    cost_center_id: str
    vehicle_id: str | None = None


class CostAllocationUpdate(BaseSchema):
    """Cost allocation update schema."""

    source_type: SourceType | None = None
    source_id: str | None = None
    amount: Decimal | None = Field(None, gt=0)
    date: dt_date | None = None
    description: str | None = Field(None, max_length=500)
    cost_center_id: str | None = None
    vehicle_id: str | None = None


class CostAllocationResponse(CostAllocationBase, TimestampMixin):
    """Cost allocation response schema."""

    id: str
    organization_id: str
    cost_center_id: str


class BudgetSummary(BaseSchema):
    """Budget summary for cost center."""

    cost_center_id: str
    cost_center_name: str
    budget: Decimal | None
    budget_period: BudgetPeriod | None
    current_spend: Decimal
    utilization_percentage: Decimal | None
    remaining_budget: Decimal | None
