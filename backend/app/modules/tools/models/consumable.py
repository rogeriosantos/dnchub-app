"""Consumable model."""

from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import ConsumableStatus, ConsumableUnit


class Consumable(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Consumable model - items tracked by quantity (drill bits, gloves, lubricants, etc.)."""

    __tablename__ = "consumables"
    __table_args__ = (
        UniqueConstraint("organization_id", "erp_code", name="uq_consumables_org_erp"),
    )

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    erp_code: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Stock management
    unit: Mapped[ConsumableUnit] = mapped_column(
        Enum(ConsumableUnit, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ConsumableUnit.PIECE,
    )
    current_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    minimum_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[ConsumableStatus] = mapped_column(
        Enum(ConsumableStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ConsumableStatus.IN_STOCK,
    )

    # Optional placement in a case
    case_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_cases.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Organisation / location
    category_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    location_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_locations.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Purchase info
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    purchase_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    case: Mapped["ToolCase | None"] = relationship(  # type: ignore[name-defined]
        back_populates="consumables",
        lazy="noload",
    )
    category: Mapped["ToolCategory | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )
    location: Mapped["ToolLocation | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )

    @property
    def is_low_stock(self) -> bool:
        """True when current quantity is at or below minimum threshold."""
        return 0 < self.current_quantity <= self.minimum_quantity

    @property
    def is_out_of_stock(self) -> bool:
        """True when current quantity is zero."""
        return self.current_quantity == 0

    def __repr__(self) -> str:
        return f"<Consumable(id={self.id}, erp_code={self.erp_code}, qty={self.current_quantity})>"
