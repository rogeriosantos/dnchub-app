"""Tool model."""

from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import ToolCondition, ToolStatus


class Tool(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Tool model - individual tools with tracking, calibration, and assignment info."""

    __tablename__ = "tools"
    __table_args__ = (
        UniqueConstraint("organization_id", "erp_code", name="uq_tools_org_erp"),
    )

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    erp_code: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(200), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    case_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_cases.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[ToolStatus] = mapped_column(
        Enum(ToolStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ToolStatus.AVAILABLE,
    )
    condition: Mapped[ToolCondition] = mapped_column(
        Enum(ToolCondition, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ToolCondition.NEW,
    )
    images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    purchase_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    location_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    calibration_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    calibration_interval_days: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    last_calibration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_calibration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    category: Mapped["ToolCategory | None"] = relationship(  # type: ignore[name-defined]
        back_populates="tools",
        lazy="noload",
    )
    case: Mapped["ToolCase | None"] = relationship(  # type: ignore[name-defined]
        back_populates="tools",
        lazy="noload",
    )
    location: Mapped["ToolLocation | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )

    @property
    def display_name(self) -> str:
        """Get display name for tool."""
        return f"{self.name} ({self.erp_code})"

    @property
    def is_calibration_due(self) -> bool:
        """Check if calibration is due."""
        if not self.calibration_required or self.next_calibration_date is None:
            return False
        return date.today() >= self.next_calibration_date

    def __repr__(self) -> str:
        return f"<Tool(id={self.id}, erp_code={self.erp_code}, name={self.name})>"
