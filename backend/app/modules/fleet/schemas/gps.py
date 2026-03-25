"""GPS and trip schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from app.shared.models.enums import AlertSeverity, AlertType, GeofenceType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class TripBase(BaseSchema):
    """Base trip schema."""

    start_latitude: Decimal = Field(..., ge=-90, le=90)
    start_longitude: Decimal = Field(..., ge=-180, le=180)
    purpose: str | None = Field(None, max_length=255)
    notes: str | None = None


class TripCreate(TripBase):
    """Trip creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_id: str
    employee_id: str | None = None
    start_time: datetime


class TripUpdate(BaseSchema):
    """Trip update schema."""

    end_time: datetime | None = None
    end_latitude: Decimal | None = Field(None, ge=-90, le=90)
    end_longitude: Decimal | None = Field(None, ge=-180, le=180)
    distance: Decimal | None = Field(None, ge=0)
    duration: int | None = Field(None, ge=0)
    max_speed: Decimal | None = Field(None, ge=0)
    average_speed: Decimal | None = Field(None, ge=0)
    idle_time: int | None = Field(None, ge=0)
    fuel_consumed: Decimal | None = Field(None, ge=0)
    purpose: str | None = Field(None, max_length=255)
    notes: str | None = None


class TripResponse(TripBase, TimestampMixin):
    """Trip response schema."""

    id: str
    organization_id: str
    vehicle_id: str
    employee_id: str | None = None
    start_time: datetime
    end_time: datetime | None = None
    start_timestamp: datetime
    start_speed: Decimal | None = None
    start_heading: Decimal | None = None
    start_accuracy: Decimal | None = None
    end_latitude: Decimal | None = None
    end_longitude: Decimal | None = None
    end_timestamp: datetime | None = None
    end_speed: Decimal | None = None
    end_heading: Decimal | None = None
    end_accuracy: Decimal | None = None
    distance: Decimal | None = None
    duration: int | None = None
    max_speed: Decimal | None = None
    average_speed: Decimal | None = None
    idle_time: int | None = None
    fuel_consumed: Decimal | None = None

    @property
    def is_active(self) -> bool:
        """Check if trip is active."""
        return self.end_time is None


class TripSummary(BaseSchema):
    """Trip summary for lists."""

    id: str
    vehicle_id: str
    employee_id: str | None
    start_time: datetime
    end_time: datetime | None
    distance: Decimal | None
    duration: int | None


class TripPositionBase(BaseSchema):
    """Base trip position schema."""

    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    timestamp: datetime
    speed: Decimal | None = Field(None, ge=0)
    heading: Decimal | None = Field(None, ge=0, lt=360)
    accuracy: Decimal | None = Field(None, ge=0)


class TripPositionCreate(TripPositionBase):
    """Trip position creation schema."""

    trip_id: str
    sequence: int = Field(..., gt=0)


class TripPositionUpdate(BaseSchema):
    """Trip position update schema."""

    latitude: Decimal | None = Field(None, ge=-90, le=90)
    longitude: Decimal | None = Field(None, ge=-180, le=180)
    timestamp: datetime | None = None
    speed: Decimal | None = Field(None, ge=0)
    heading: Decimal | None = Field(None, ge=0, lt=360)
    accuracy: Decimal | None = Field(None, ge=0)


class TripPositionResponse(TripPositionBase):
    """Trip position response schema."""

    id: str
    trip_id: str
    sequence: int


class GeofenceBase(BaseSchema):
    """Base geofence schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    type: GeofenceType
    center_latitude: Decimal | None = Field(None, ge=-90, le=90)
    center_longitude: Decimal | None = Field(None, ge=-180, le=180)
    radius: Decimal | None = Field(None, gt=0)
    coordinates: dict[str, Any] | None = None
    is_active: bool = True
    alert_on_entry: bool = False
    alert_on_exit: bool = False


class GeofenceCreate(GeofenceBase):
    """Geofence creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class GeofenceUpdate(BaseSchema):
    """Geofence update schema."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    type: GeofenceType | None = None
    center_latitude: Decimal | None = Field(None, ge=-90, le=90)
    center_longitude: Decimal | None = Field(None, ge=-180, le=180)
    radius: Decimal | None = Field(None, gt=0)
    coordinates: dict[str, Any] | None = None
    is_active: bool | None = None
    alert_on_entry: bool | None = None
    alert_on_exit: bool | None = None


class GeofenceResponse(GeofenceBase, TimestampMixin, SoftDeleteMixin):
    """Geofence response schema."""

    id: str
    organization_id: str


class GpsAlertBase(BaseSchema):
    """Base GPS alert schema."""

    type: AlertType
    severity: AlertSeverity
    message: str
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    timestamp: datetime
    speed: Decimal | None = Field(None, ge=0)
    heading: Decimal | None = Field(None, ge=0, lt=360)
    accuracy: Decimal | None = Field(None, ge=0)


class GpsAlertCreate(GpsAlertBase):
    """GPS alert creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_id: str


class GpsAlertUpdate(BaseSchema):
    """GPS alert update schema."""

    is_acknowledged: bool | None = None
    acknowledged_by: str | None = None
    acknowledged_at: datetime | None = None


class GpsAlertResponse(GpsAlertBase):
    """GPS alert response schema."""

    id: str
    organization_id: str
    vehicle_id: str
    is_acknowledged: bool = False
    acknowledged_by: str | None = None
    acknowledged_at: datetime | None = None
    created_at: datetime


class GpsAlertSummary(BaseSchema):
    """GPS alert summary for lists."""

    id: str
    vehicle_id: str
    type: AlertType
    severity: AlertSeverity
    timestamp: datetime
    is_acknowledged: bool
