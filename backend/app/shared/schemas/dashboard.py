"""Dashboard schemas."""

from datetime import date as dt_date
from decimal import Decimal

from pydantic import Field

from app.shared.models.enums import MaintenancePriority, MaintenanceStatus, VehicleStatus
from app.shared.schemas.base import BaseSchema


class FleetOverview(BaseSchema):
    """Fleet overview metrics."""

    total_vehicles: int = 0
    active_vehicles: int = 0
    vehicles_in_maintenance: int = 0
    vehicles_out_of_service: int = 0
    total_drivers: int = 0
    available_drivers: int = 0
    drivers_on_trip: int = 0


class FuelSummary(BaseSchema):
    """Fuel summary metrics."""

    total_cost: Decimal = Decimal("0")
    total_volume: Decimal = Decimal("0")
    average_efficiency: Decimal | None = None
    entries_count: int = 0
    cost_trend_percentage: Decimal | None = None


class MaintenanceSummary(BaseSchema):
    """Maintenance summary metrics."""

    total_tasks: int = 0
    scheduled: int = 0
    in_progress: int = 0
    overdue: int = 0
    completed_this_month: int = 0
    total_cost_this_month: Decimal = Decimal("0")


class AlertsSummary(BaseSchema):
    """Alerts summary metrics."""

    total_unacknowledged: int = 0
    high_severity: int = 0
    medium_severity: int = 0
    low_severity: int = 0


class VehicleStatusCount(BaseSchema):
    """Vehicle status count."""

    status: VehicleStatus
    count: int


class UpcomingMaintenance(BaseSchema):
    """Upcoming maintenance item."""

    id: str
    vehicle_id: str
    vehicle_name: str
    title: str
    scheduled_date: dt_date | None
    priority: MaintenancePriority
    status: MaintenanceStatus


class ExpiringDocument(BaseSchema):
    """Expiring document item."""

    id: str
    entity_type: str
    entity_id: str
    entity_name: str
    document_type: str
    document_name: str
    expiry_date: dt_date


class RecentActivity(BaseSchema):
    """Recent activity item."""

    id: str
    type: str
    title: str
    description: str
    timestamp: str
    entity_id: str | None = None
    entity_type: str | None = None


class DashboardData(BaseSchema):
    """Complete dashboard data."""

    fleet_overview: FleetOverview
    fuel_summary: FuelSummary
    maintenance_summary: MaintenanceSummary
    alerts_summary: AlertsSummary
    vehicle_status_breakdown: list[VehicleStatusCount]
    upcoming_maintenance: list[UpcomingMaintenance]
    expiring_documents: list[ExpiringDocument]
    recent_activity: list[RecentActivity]


class DashboardFleetStatus(BaseSchema):
    """Fleet status for dashboard service."""

    total_vehicles: int = 0
    active_vehicles: int = 0
    in_maintenance_vehicles: int = 0
    inactive_vehicles: int = 0
    total_drivers: int = 0
    available_drivers: int = 0
    on_duty_drivers: int = 0
    active_trips: int = 0


class DashboardStats(BaseSchema):
    """Dashboard statistics for a period."""

    period_start: dt_date
    period_end: dt_date
    total_fuel_cost: Decimal = Decimal("0")
    total_fuel_volume: Decimal = Decimal("0")
    average_fuel_efficiency: Decimal | None = None
    total_maintenance_cost: Decimal = Decimal("0")
    completed_maintenance_tasks: int = 0
    pending_maintenance_tasks: int = 0
    total_trips: int = 0
    total_distance: Decimal = Decimal("0")
    # Dashboard KPI fields
    total_vehicles: int = 0
    active_vehicles: int = 0
    vehicles_in_maintenance: int = 0
    total_drivers: int = 0
    drivers_on_duty: int = 0
    fuel_cost_this_month: Decimal = Decimal("0")
    fuel_cost_change_percent: Decimal = Decimal("0")
    maintenance_cost_this_month: Decimal = Decimal("0")
    maintenance_due_count: int = 0
    maintenance_overdue_count: int = 0


class DashboardAlerts(BaseSchema):
    """Alerts summary for dashboard."""

    critical_alerts: int = 0
    high_alerts: int = 0
    medium_alerts: int = 0
    low_alerts: int = 0
    overdue_maintenance: int = 0
    expiring_documents: int = 0
    expiring_licenses: int = 0
