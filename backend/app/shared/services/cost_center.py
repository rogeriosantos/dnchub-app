"""Cost center service."""

from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.models import CostAllocation, CostCenter, FuelEntry, MaintenanceTask
from app.models.enums import CostType
from app.schemas import (
    CostAllocationCreate,
    CostAllocationUpdate,
    CostCenterCreate,
    CostCenterUpdate,
)
from app.shared.services.base import BaseService


class CostCenterService(BaseService[CostCenter, CostCenterCreate, CostCenterUpdate]):
    """Cost center service."""

    def __init__(self):
        super().__init__(CostCenter)

    def get_by_code(
        self,
        db: Session,
        code: str,
        organization_id: str,
    ) -> CostCenter | None:
        """Get cost center by code within an organization."""
        result = db.execute(
            select(CostCenter).where(
                CostCenter.code == code,
                CostCenter.organization_id == organization_id,
                CostCenter.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: CostCenterCreate,
    ) -> CostCenter:
        """Create a cost center with unique code validation."""
        existing = self.get_by_code(
            db,
            code=obj_in.code,
            organization_id=obj_in.organization_id,
        )
        if existing:
            raise ConflictError(
                message="Cost center with this code already exists",
                details={"code": obj_in.code},
            )

        return super().create(db, obj_in=obj_in)

    def get_active_cost_centers(
        self,
        db: Session,
        organization_id: str,
    ) -> list[CostCenter]:
        """Get active cost centers."""
        result = db.execute(
            select(CostCenter).where(
                CostCenter.organization_id == organization_id,
                CostCenter.is_active == True,
                CostCenter.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def get_cost_summary(
        self,
        db: Session,
        cost_center_id: str,
        start_date: date,
        end_date: date,
    ) -> dict:
        """Get cost summary for a cost center."""
        # Get fuel costs
        fuel_result = db.execute(
            select(func.sum(FuelEntry.total_cost)).where(
                FuelEntry.cost_center_id == cost_center_id,
                FuelEntry.date >= start_date,
                FuelEntry.date <= end_date,
                FuelEntry.deleted_at.is_(None),
            )
        )
        fuel_cost = fuel_result.scalar() or Decimal("0")

        # Get maintenance costs
        maintenance_result = db.execute(
            select(func.sum(MaintenanceTask.actual_cost)).where(
                MaintenanceTask.cost_center_id == cost_center_id,
                MaintenanceTask.completed_date >= start_date,
                MaintenanceTask.completed_date <= end_date,
                MaintenanceTask.deleted_at.is_(None),
            )
        )
        maintenance_cost = maintenance_result.scalar() or Decimal("0")

        # Get allocated costs
        allocation_result = db.execute(
            select(func.sum(CostAllocation.amount)).where(
                CostAllocation.cost_center_id == cost_center_id,
                CostAllocation.date >= start_date,
                CostAllocation.date <= end_date,
                CostAllocation.deleted_at.is_(None),
            )
        )
        allocated_cost = allocation_result.scalar() or Decimal("0")

        return {
            "fuel_cost": fuel_cost,
            "maintenance_cost": maintenance_cost,
            "allocated_cost": allocated_cost,
            "total_cost": fuel_cost + maintenance_cost + allocated_cost,
            "period_start": start_date,
            "period_end": end_date,
        }

    def check_budget(
        self,
        db: Session,
        cost_center: CostCenter,
        start_date: date,
        end_date: date,
    ) -> dict:
        """Check budget status for a cost center."""
        summary = self.get_cost_summary(
            db,
            cost_center.id,
            start_date,
            end_date,
        )

        budget = cost_center.budget or Decimal("0")
        total_cost = summary["total_cost"]
        remaining = budget - total_cost
        utilization = (total_cost / budget * 100) if budget > 0 else Decimal("0")

        return {
            "budget": budget,
            "spent": total_cost,
            "remaining": remaining,
            "utilization_percentage": utilization,
            "is_over_budget": remaining < 0,
            **summary,
        }


class CostAllocationService(
    BaseService[CostAllocation, CostAllocationCreate, CostAllocationUpdate]
):
    """Cost allocation service."""

    def __init__(self):
        super().__init__(CostAllocation)

    def get_allocations_by_cost_center(
        self,
        db: Session,
        cost_center_id: str,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CostAllocation]:
        """Get cost allocations for a cost center."""
        result = db.execute(
            select(CostAllocation)
            .where(
                CostAllocation.cost_center_id == cost_center_id,
                CostAllocation.deleted_at.is_(None),
            )
            .order_by(CostAllocation.date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def get_allocations_by_vehicle(
        self,
        db: Session,
        vehicle_id: str,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CostAllocation]:
        """Get cost allocations for a vehicle."""
        result = db.execute(
            select(CostAllocation)
            .where(
                CostAllocation.vehicle_id == vehicle_id,
                CostAllocation.deleted_at.is_(None),
            )
            .order_by(CostAllocation.date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def get_allocations_by_date_range(
        self,
        db: Session,
        organization_id: str,
        start_date: date,
        end_date: date,
        *,
        cost_type: CostType | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CostAllocation]:
        """Get cost allocations within a date range."""
        query = select(CostAllocation).where(
            CostAllocation.organization_id == organization_id,
            CostAllocation.date >= start_date,
            CostAllocation.date <= end_date,
            CostAllocation.deleted_at.is_(None),
        )

        if cost_type:
            query = query.where(CostAllocation.cost_type == cost_type)

        result = db.execute(
            query.order_by(CostAllocation.date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def get_cost_breakdown_by_type(
        self,
        db: Session,
        organization_id: str,
        start_date: date,
        end_date: date,
    ) -> list[dict]:
        """Get cost breakdown by type for a period."""
        result = db.execute(
            select(
                CostAllocation.cost_type,
                func.sum(CostAllocation.amount).label("total"),
                func.count(CostAllocation.id).label("count"),
            )
            .where(
                CostAllocation.organization_id == organization_id,
                CostAllocation.date >= start_date,
                CostAllocation.date <= end_date,
                CostAllocation.deleted_at.is_(None),
            )
            .group_by(CostAllocation.cost_type)
        )

        return [
            {
                "cost_type": row.cost_type,
                "total": row.total or Decimal("0"),
                "count": row.count or 0,
            }
            for row in result.all()
        ]


cost_center_service = CostCenterService()
cost_allocation_service = CostAllocationService()
