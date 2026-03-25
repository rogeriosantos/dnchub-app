"""Fleet module schemas."""

from app.modules.fleet.schemas.fuel import (
    FuelAnalytics,
    FuelEntryCreate,
    FuelEntryResponse,
    FuelEntrySummary,
    FuelEntryUpdate,
)
from app.modules.fleet.schemas.fuel_pump import (
    FuelPumpCreate,
    FuelPumpLevelAdjustment,
    FuelPumpResponse,
    FuelPumpSummary,
    FuelPumpUpdate,
)
from app.modules.fleet.schemas.fuel_pump_delivery import (
    FuelPumpDeliveryCreate,
    FuelPumpDeliveryResponse,
    FuelPumpDeliverySummary,
    FuelPumpDeliveryUpdate,
)
from app.modules.fleet.schemas.gps import (
    GeofenceCreate,
    GeofenceResponse,
    GeofenceUpdate,
    GpsAlertCreate,
    GpsAlertResponse,
    GpsAlertSummary,
    GpsAlertUpdate,
    TripCreate,
    TripPositionCreate,
    TripPositionResponse,
    TripPositionUpdate,
    TripResponse,
    TripSummary,
    TripUpdate,
)
from app.modules.fleet.schemas.maintenance import (
    MaintenanceScheduleCreate,
    MaintenanceScheduleResponse,
    MaintenanceScheduleUpdate,
    MaintenanceTaskCreate,
    MaintenanceTaskResponse,
    MaintenanceTaskSummary,
    MaintenanceTaskUpdate,
)
from app.modules.fleet.schemas.ticket import (
    TicketCreate,
    TicketPayRequest,
    TicketResponse,
    TicketStats,
    TicketSummary,
    TicketUpdate,
)
from app.modules.fleet.schemas.vehicle import (
    VehicleCreate,
    VehicleGroupCreate,
    VehicleGroupResponse,
    VehicleGroupUpdate,
    VehicleResponse,
    VehicleSummary,
    VehicleUpdate,
)
