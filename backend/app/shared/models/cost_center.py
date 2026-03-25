"""Cost center and allocation models."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import BudgetPeriod, SourceType


class CostCenter(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Cost center model - budget tracking and expense allocation."""

    __tablename__ = "cost_centers"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cost_centers.id", ondelete="RESTRICT"),
        nullable=True,
    )
    budget: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    budget_period: Mapped[BudgetPeriod | None] = mapped_column(
        Enum(BudgetPeriod, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    current_spend: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=0,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    manager_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="cost_centers",
    )
    parent: Mapped["CostCenter | None"] = relationship(
        back_populates="children",
        remote_side="CostCenter.id",
    )
    children: Mapped[list["CostCenter"]] = relationship(
        back_populates="parent",
        lazy="selectin",
    )
    manager: Mapped["User | None"] = relationship()  # type: ignore[name-defined]
    vehicles: Mapped[list["Vehicle"]] = relationship(  # type: ignore[name-defined]
        back_populates="cost_center",
        lazy="selectin",
    )
    employees: Mapped[list["Employee"]] = relationship(  # type: ignore[name-defined]
        back_populates="cost_center",
        lazy="selectin",
    )
    allocations: Mapped[list["CostAllocation"]] = relationship(
        back_populates="cost_center",
        lazy="selectin",
    )

    @property
    def budget_utilization(self) -> Decimal | None:
        """Calculate budget utilization percentage."""
        if self.budget and self.budget > 0:
            return (self.current_spend / self.budget) * 100
        return None

    def __repr__(self) -> str:
        return f"<CostCenter(id={self.id}, code={self.code}, name={self.name})>"


class CostAllocation(Base, UUIDMixin, TimestampMixin):
    """Cost allocation model - links expenses to cost centers."""

    __tablename__ = "cost_allocations"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    cost_center_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cost_centers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    source_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    cost_center: Mapped["CostCenter"] = relationship(back_populates="allocations")

    def __repr__(self) -> str:
        return f"<CostAllocation(id={self.id}, amount={self.amount})>"
