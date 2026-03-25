"""Dashboard service for aggregated data."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Employee,
    FuelEntry,
    GpsAlert,
    MaintenanceTask,
    Trip,
    Vehicle,
)
from app.models.enums import (
    AlertSeverity,
    EmployeeStatus,
    MaintenanceStatus,
    VehicleStatus,
)
from app.schemas import (
    DashboardAlerts,
    DashboardFleetStatus,
    DashboardStats,
)


class DashboardService:
    """Dashboard service for aggregated metrics."""

    def get_fleet_status(
        self,
        db: Session,
        organization_id: str,
    ) -> DashboardFleetStatus:
        """Get current fleet status."""
        # Vehicle status counts
        vehicle_result = db.execute(
            select(
                Vehicle.status,
                func.count(Vehicle.id).label("count"),
            )
            .where(
                Vehicle.organization_id == organization_id,
                Vehicle.deleted_at.is_(None),
            )
            .group_by(Vehicle.status)
        )
        vehicle_counts = {row.status: row.count for row in vehicle_result.all()}

        total_vehicles = sum(vehicle_counts.values())
        active_vehicles = vehicle_counts.get(VehicleStatus.ACTIVE, 0)
        maintenance_vehicles = vehicle_counts.get(VehicleStatus.IN_MAINTENANCE, 0)
        inactive_vehicles = vehicle_counts.get(VehicleStatus.INACTIVE, 0)

        # Employee status counts
        employee_result = db.execute(
            select(
                Employee.status,
                func.count(Employee.id).label("count"),
            )
            .where(
                Employee.organization_id == organization_id,
                Employee.deleted_at.is_(None),
            )
            .group_by(Employee.status)
        )
        employee_counts = {row.status: row.count for row in employee_result.all()}

        total_employees = sum(employee_counts.values())
        available_employees = employee_counts.get(EmployeeStatus.AVAILABLE, 0)
        on_duty_employees = employee_counts.get(EmployeeStatus.ON_DUTY, 0)

        # Active trips count (trips without end_time are in progress)
        trips_result = db.execute(
            select(func.count(Trip.id)).where(
                Trip.organization_id == organization_id,
                Trip.end_time.is_(None),
            )
        )
        active_trips = trips_result.scalar() or 0

        return DashboardFleetStatus(
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            in_maintenance_vehicles=maintenance_vehicles,
            inactive_vehicles=inactive_vehicles,
            total_drivers=total_employees,
            available_drivers=available_employees,
            on_duty_drivers=on_duty_employees,
            active_trips=active_trips,
        )

    def get_stats(
        self,
        db: Session,
        organization_id: str,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> DashboardStats:
        """Get dashboard statistics for a period."""
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=30)

        # Current month boundaries for fuel cost
        today = date.today()
        current_month_start = today.replace(day=1)
        # Last month boundaries for comparison
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        # Fuel statistics for period
        fuel_result = db.execute(
            select(
                func.sum(FuelEntry.total_cost).label("total_cost"),
                func.sum(FuelEntry.volume).label("total_volume"),
                func.avg(FuelEntry.fuel_efficiency).label("avg_efficiency"),
            ).where(
                FuelEntry.organization_id == organization_id,
                FuelEntry.date >= start_date,
                FuelEntry.date <= end_date,
                FuelEntry.deleted_at.is_(None),
            )
        )
        fuel_row = fuel_result.one()

        # Current month fuel cost
        current_month_fuel_result = db.execute(
            select(func.sum(FuelEntry.total_cost)).where(
                FuelEntry.organization_id == organization_id,
                FuelEntry.date >= current_month_start,
                FuelEntry.date <= today,
                FuelEntry.deleted_at.is_(None),
            )
        )
        fuel_cost_this_month = current_month_fuel_result.scalar() or Decimal("0")

        # Last month fuel cost for comparison
        last_month_fuel_result = db.execute(
            select(func.sum(FuelEntry.total_cost)).where(
                FuelEntry.organization_id == organization_id,
                FuelEntry.date >= last_month_start,
                FuelEntry.date <= last_month_end,
                FuelEntry.deleted_at.is_(None),
            )
        )
        fuel_cost_last_month = last_month_fuel_result.scalar() or Decimal("0")

        # Calculate fuel cost change percentage
        fuel_cost_change_percent = Decimal("0")
        if fuel_cost_last_month > 0:
            fuel_cost_change_percent = (
                (fuel_cost_this_month - fuel_cost_last_month) / fuel_cost_last_month * 100
            )

        # Maintenance statistics
        maintenance_result = db.execute(
            select(
                func.sum(MaintenanceTask.actual_cost).label("total_cost"),
                func.count(MaintenanceTask.id).label("total_tasks"),
            ).where(
                MaintenanceTask.organization_id == organization_id,
                MaintenanceTask.status == MaintenanceStatus.COMPLETED,
                MaintenanceTask.completed_date >= start_date,
                MaintenanceTask.completed_date <= end_date,
                MaintenanceTask.deleted_at.is_(None),
            )
        )
        maint_row = maintenance_result.one()

        # Pending maintenance count (due)
        pending_maint_result = db.execute(
            select(func.count(MaintenanceTask.id)).where(
                MaintenanceTask.organization_id == organization_id,
                MaintenanceTask.status.in_([
                    MaintenanceStatus.SCHEDULED,
                    MaintenanceStatus.IN_PROGRESS,
                ]),
                MaintenanceTask.deleted_at.is_(None),
            )
        )
        pending_maintenance = pending_maint_result.scalar() or 0

        # Overdue maintenance count
        overdue_maint_result = db.execute(
            select(func.count(MaintenanceTask.id)).where(
                MaintenanceTask.organization_id == organization_id,
                MaintenanceTask.status.in_([
                    MaintenanceStatus.SCHEDULED,
                    MaintenanceStatus.IN_PROGRESS,
                ]),
                MaintenanceTask.scheduled_date < today,
                MaintenanceTask.deleted_at.is_(None),
            )
        )
        overdue_maintenance = overdue_maint_result.scalar() or 0

        # Current month maintenance cost
        current_month_maint_result = db.execute(
            select(func.sum(MaintenanceTask.actual_cost)).where(
                MaintenanceTask.organization_id == organization_id,
                MaintenanceTask.status == MaintenanceStatus.COMPLETED,
                MaintenanceTask.completed_date >= current_month_start,
                MaintenanceTask.completed_date <= today,
                MaintenanceTask.deleted_at.is_(None),
            )
        )
        maintenance_cost_this_month = current_month_maint_result.scalar() or Decimal("0")

        # Trip statistics (completed trips have end_time set)
        trip_result = db.execute(
            select(
                func.count(Trip.id).label("total_trips"),
                func.sum(Trip.distance).label("total_distance"),
            ).where(
                Trip.organization_id == organization_id,
                Trip.end_time.is_not(None),
                Trip.start_time >= start_date,
                Trip.end_time <= end_date,
            )
        )
        trip_row = trip_result.one()

        # Vehicle counts
        vehicle_result = db.execute(
            select(
                Vehicle.status,
                func.count(Vehicle.id).label("count"),
            )
            .where(
                Vehicle.organization_id == organization_id,
                Vehicle.deleted_at.is_(None),
            )
            .group_by(Vehicle.status)
        )
        vehicle_counts = {row.status: row.count for row in vehicle_result.all()}
        total_vehicles = sum(vehicle_counts.values())
        active_vehicles = vehicle_counts.get(VehicleStatus.ACTIVE, 0)
        vehicles_in_maintenance = vehicle_counts.get(VehicleStatus.IN_MAINTENANCE, 0)

        # Employee counts
        employee_result = db.execute(
            select(
                Employee.status,
                func.count(Employee.id).label("count"),
            )
            .where(
                Employee.organization_id == organization_id,
                Employee.deleted_at.is_(None),
            )
            .group_by(Employee.status)
        )
        employee_counts = {row.status: row.count for row in employee_result.all()}
        total_employees = sum(employee_counts.values())
        employees_on_duty = employee_counts.get(EmployeeStatus.ON_DUTY, 0)

        return DashboardStats(
            period_start=start_date,
            period_end=end_date,
            total_fuel_cost=fuel_row.total_cost or Decimal("0"),
            total_fuel_volume=fuel_row.total_volume or Decimal("0"),
            average_fuel_efficiency=fuel_row.avg_efficiency,
            total_maintenance_cost=maint_row.total_cost or Decimal("0"),
            completed_maintenance_tasks=maint_row.total_tasks or 0,
            pending_maintenance_tasks=pending_maintenance,
            total_trips=trip_row.total_trips or 0,
            total_distance=trip_row.total_distance or Decimal("0"),
            # Dashboard KPI fields
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            vehicles_in_maintenance=vehicles_in_maintenance,
            total_drivers=total_employees,
            drivers_on_duty=employees_on_duty,
            fuel_cost_this_month=fuel_cost_this_month,
            fuel_cost_change_percent=fuel_cost_change_percent,
            maintenance_cost_this_month=maintenance_cost_this_month,
            maintenance_due_count=pending_maintenance,
            maintenance_overdue_count=overdue_maintenance,
        )

    def get_alerts_summary(
        self,
        db: Session,
        organization_id: str,
    ) -> DashboardAlerts:
        """Get alerts summary."""
        # Unacknowledged GPS alerts by severity
        alerts_result = db.execute(
            select(
                GpsAlert.severity,
                func.count(GpsAlert.id).label("count"),
            )
            .where(
                GpsAlert.organization_id == organization_id,
                GpsAlert.is_acknowledged == False,
            )
            .group_by(GpsAlert.severity)
        )
        alert_counts = {row.severity: row.count for row in alerts_result.all()}

        # Overdue maintenance
        today = date.today()
        overdue_result = db.execute(
            select(func.count(MaintenanceTask.id)).where(
                MaintenanceTask.organization_id == organization_id,
                MaintenanceTask.status.in_([
                    MaintenanceStatus.SCHEDULED,
                    MaintenanceStatus.IN_PROGRESS,
                ]),
                MaintenanceTask.scheduled_date < today,
                MaintenanceTask.deleted_at.is_(None),
            )
        )
        overdue_maintenance = overdue_result.scalar() or 0

        # Expiring documents (within 30 days)
        from app.models import Document

        expiry_threshold = today + timedelta(days=30)
        expiring_docs_result = db.execute(
            select(func.count(Document.id)).where(
                Document.organization_id == organization_id,
                Document.expiry_date.is_not(None),
                Document.expiry_date <= expiry_threshold,
                Document.expiry_date >= today,
                Document.deleted_at.is_(None),
            )
        )
        expiring_documents = expiring_docs_result.scalar() or 0

        # Expiring licenses (within 30 days)
        expiring_licenses_result = db.execute(
            select(func.count(Employee.id)).where(
                Employee.organization_id == organization_id,
                Employee.license_expiry <= expiry_threshold,
                Employee.license_expiry >= today,
                Employee.deleted_at.is_(None),
            )
        )
        expiring_licenses = expiring_licenses_result.scalar() or 0

        return DashboardAlerts(
            critical_alerts=alert_counts.get(AlertSeverity.CRITICAL, 0),
            high_alerts=alert_counts.get(AlertSeverity.HIGH, 0),
            medium_alerts=alert_counts.get(AlertSeverity.MEDIUM, 0),
            low_alerts=alert_counts.get(AlertSeverity.LOW, 0),
            overdue_maintenance=overdue_maintenance,
            expiring_documents=expiring_documents,
            expiring_licenses=expiring_licenses,
        )

    def get_recent_activity(
        self,
        db: Session,
        organization_id: str,
        limit: int = 10,
    ) -> list[dict]:
        """Get recent activity feed."""
        activities = []

        # Recent fuel entries
        fuel_result = db.execute(
            select(FuelEntry)
            .where(
                FuelEntry.organization_id == organization_id,
                FuelEntry.deleted_at.is_(None),
            )
            .order_by(FuelEntry.created_at.desc())
            .limit(limit)
        )
        for entry in fuel_result.scalars():
            activities.append({
                "type": "fuel_entry",
                "timestamp": entry.created_at,
                "description": f"Fuel entry: {entry.volume}L",
                "entity_id": entry.id,
            })

        # Recent maintenance completions
        maint_result = db.execute(
            select(MaintenanceTask)
            .where(
                MaintenanceTask.organization_id == organization_id,
                MaintenanceTask.status == MaintenanceStatus.COMPLETED,
                MaintenanceTask.deleted_at.is_(None),
            )
            .order_by(MaintenanceTask.completed_date.desc())
            .limit(limit)
        )
        for task in maint_result.scalars():
            activities.append({
                "type": "maintenance_completed",
                "timestamp": task.completed_date,
                "description": f"Maintenance completed: {task.type.value}",
                "entity_id": task.id,
            })

        # Recent completed trips (have end_time set)
        trip_result = db.execute(
            select(Trip)
            .where(
                Trip.organization_id == organization_id,
                Trip.end_time.is_not(None),
            )
            .order_by(Trip.end_time.desc())
            .limit(limit)
        )
        for trip in trip_result.scalars():
            activities.append({
                "type": "trip_completed",
                "timestamp": trip.end_time,
                "description": f"Trip completed: {trip.distance or 0} km",
                "entity_id": trip.id,
            })

        # Sort by timestamp and limit
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]


dashboard_service = DashboardService()
