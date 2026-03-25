"""Tool calibration model."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class ToolCalibration(Base, UUIDMixin, TimestampMixin):
    """Tool calibration model - historical records of tool calibrations."""

    __tablename__ = "tool_calibrations"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    tool_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tools.id", ondelete="RESTRICT"),
        nullable=False,
    )
    calibration_date: Mapped[date] = mapped_column(Date, nullable=False)
    next_calibration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    certificate_number: Mapped[str | None] = mapped_column(String(200), nullable=True)
    calibrated_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    certificate_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    tool: Mapped["Tool"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )

    def __repr__(self) -> str:
        return (
            f"<ToolCalibration(id={self.id}, tool_id={self.tool_id}, "
            f"date={self.calibration_date})>"
        )
