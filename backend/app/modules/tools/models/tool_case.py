"""Tool case model."""

from sqlalchemy import Enum, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import ToolCondition, ToolStatus


class ToolCase(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Tool case model - containers/cases that hold multiple tools."""

    __tablename__ = "tool_cases"
    __table_args__ = (
        UniqueConstraint("organization_id", "erp_code", name="uq_tool_cases_org_erp"),
    )

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    erp_code: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_locations.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    tools: Mapped[list["Tool"]] = relationship(  # type: ignore[name-defined]
        back_populates="case",
        lazy="noload",
    )
    consumables: Mapped[list["Consumable"]] = relationship(  # type: ignore[name-defined]
        back_populates="case",
        lazy="noload",
    )
    location: Mapped["ToolLocation | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )

    @property
    def display_name(self) -> str:
        """Get display name for case."""
        return f"{self.name} ({self.erp_code})"

    def __repr__(self) -> str:
        return f"<ToolCase(id={self.id}, erp_code={self.erp_code}, name={self.name})>"
