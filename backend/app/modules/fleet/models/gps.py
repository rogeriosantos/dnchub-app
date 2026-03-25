"""GPS tracking models."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import AlertSeverity, AlertType, GeofenceType


class Trip(Base, UUIDMixin, TimestampMixin):
    """Trip model - GPS-tracked trips and route history."""

    __tablename__ = "trips"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    vehicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    employee_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    start_latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    start_longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    start_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    start_speed: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    start_heading: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    start_accuracy: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    end_latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    end_longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    end_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    end_speed: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    end_heading: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    end_accuracy: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    distance: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_speed: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    average_speed: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    idle_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fuel_consumed: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship(  # type: ignore[name-defined]
        back_populates="trips",
    )
    employee: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        back_populates="trips",
    )
    positions: Mapped[list["TripPosition"]] = relationship(
        back_populates="trip",
        lazy="selectin",
    )

    @property
    def is_active(self) -> bool:
        """Check if trip is currently active."""
        return self.end_time is None

    def __repr__(self) -> str:
        return f"<Trip(id={self.id}, vehicle={self.vehicle_id})>"


class TripPosition(Base, UUIDMixin):
    """Trip position model - detailed GPS breadcrumbs for trip routes."""

    __tablename__ = "trip_positions"

    trip_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False,
    )
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    speed: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    heading: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    accuracy: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    trip: Mapped["Trip"] = relationship(back_populates="positions")

    def __repr__(self) -> str:
        return f"<TripPosition(trip={self.trip_id}, seq={self.sequence})>"


class Geofence(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Geofence model - geographic boundaries for alerts."""

    __tablename__ = "geofences"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[GeofenceType] = mapped_column(
        Enum(GeofenceType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    center_latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7),
        nullable=True,
    )
    center_longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7),
        nullable=True,
    )
    radius: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    coordinates: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    alert_on_entry: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    alert_on_exit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    def __repr__(self) -> str:
        return f"<Geofence(id={self.id}, name={self.name}, type={self.type})>"


class GpsAlert(Base, UUIDMixin):
    """GPS alert model - GPS-based alerts and violations."""

    __tablename__ = "gps_alerts"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    vehicle_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    speed: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    heading: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    accuracy: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    is_acknowledged: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    acknowledged_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship()  # type: ignore[name-defined]
    acknowledger: Mapped["User | None"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<GpsAlert(id={self.id}, type={self.type}, severity={self.severity})>"
