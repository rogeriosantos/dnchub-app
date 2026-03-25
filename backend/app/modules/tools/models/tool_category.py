"""Tool category model."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class ToolCategory(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Tool category model - hierarchical categorization of tools."""

    __tablename__ = "tool_categories"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tool_categories.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    parent: Mapped["ToolCategory | None"] = relationship(
        back_populates="children",
        remote_side="ToolCategory.id",
        lazy="noload",
    )
    children: Mapped[list["ToolCategory"]] = relationship(
        back_populates="parent",
        lazy="noload",
    )
    tools: Mapped[list["Tool"]] = relationship(  # type: ignore[name-defined]
        back_populates="category",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<ToolCategory(id={self.id}, name={self.name})>"
