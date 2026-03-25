"""Tool assignment model."""

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.shared.models.enums import ToolAssignmentType, ToolCondition


class ToolAssignment(Base, UUIDMixin, TimestampMixin):
    """Tool assignment model - historical records of tool/case assignments."""

    __tablename__ = "tool_assignments"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    tool_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tools.id", ondelete="SET NULL"),
        nullable=True,
    )
    case_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_cases.id", ondelete="SET NULL"),
        nullable=True,
    )
    assignment_type: Mapped[ToolAssignmentType] = mapped_column(
        Enum(ToolAssignmentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    assigned_to_employee_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_to_vehicle_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
    )
    department: Mapped[str | None] = mapped_column(String(200), nullable=True)
    section: Mapped[str | None] = mapped_column(String(200), nullable=True)
    location_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    assigned_by_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    condition_at_checkout: Mapped[ToolCondition | None] = mapped_column(
        Enum(ToolCondition, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    condition_at_return: Mapped[ToolCondition | None] = mapped_column(
        Enum(ToolCondition, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    tool: Mapped["Tool | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )
    case: Mapped["ToolCase | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )
    assigned_to_employee: Mapped["Employee | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
        foreign_keys=[assigned_to_employee_id],
    )
    assigned_to_vehicle: Mapped["Vehicle | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
        foreign_keys=[assigned_to_vehicle_id],
    )
    location: Mapped["ToolLocation | None"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
    )
    assigned_by: Mapped["User"] = relationship(  # type: ignore[name-defined]
        lazy="noload",
        foreign_keys=[assigned_by_id],
    )

    @property
    def is_active(self) -> bool:
        """Check if assignment is currently active (not returned)."""
        return self.returned_at is None

    def __repr__(self) -> str:
        return (
            f"<ToolAssignment(id={self.id}, tool_id={self.tool_id}, "
            f"case_id={self.case_id}, type={self.assignment_type})>"
        )
