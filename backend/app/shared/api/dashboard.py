"""Dashboard endpoints."""

from datetime import date

from fastapi import APIRouter, Query

from app.shared.api.deps import CurrentUserDep, DBDep
from app.schemas import (
    DashboardAlerts,
    DashboardFleetStatus,
    DashboardStats,
)
from app.services import dashboard_service

router = APIRouter()


@router.get("/fleet-status", response_model=DashboardFleetStatus)
def get_fleet_status(
    db: DBDep,
    current_user: CurrentUserDep,
) -> DashboardFleetStatus:
    """Get current fleet status overview."""
    return dashboard_service.get_fleet_status(
        db, organization_id=current_user.organization_id
    )


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: DBDep,
    current_user: CurrentUserDep,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> DashboardStats:
    """Get dashboard statistics for a period."""
    return dashboard_service.get_stats(
        db,
        organization_id=current_user.organization_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/alerts", response_model=DashboardAlerts)
def get_alerts_summary(
    db: DBDep,
    current_user: CurrentUserDep,
) -> DashboardAlerts:
    """Get alerts summary."""
    return dashboard_service.get_alerts_summary(
        db, organization_id=current_user.organization_id
    )


@router.get("/recent-activity")
def get_recent_activity(
    db: DBDep,
    current_user: CurrentUserDep,
    limit: int = Query(default=10, ge=1, le=50),
) -> list[dict]:
    """Get recent activity feed."""
    return dashboard_service.get_recent_activity(
        db,
        organization_id=current_user.organization_id,
        limit=limit,
    )


@router.get("/overview")
def get_dashboard_overview(
    db: DBDep,
    current_user: CurrentUserDep,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> dict:
    """Get complete dashboard overview."""
    fleet_status = dashboard_service.get_fleet_status(
        db, organization_id=current_user.organization_id
    )
    stats = dashboard_service.get_stats(
        db,
        organization_id=current_user.organization_id,
        start_date=start_date,
        end_date=end_date,
    )
    alerts = dashboard_service.get_alerts_summary(
        db, organization_id=current_user.organization_id
    )
    recent_activity = dashboard_service.get_recent_activity(
        db,
        organization_id=current_user.organization_id,
        limit=5,
    )

    return {
        "fleet_status": fleet_status,
        "stats": stats,
        "alerts": alerts,
        "recent_activity": recent_activity,
    }
