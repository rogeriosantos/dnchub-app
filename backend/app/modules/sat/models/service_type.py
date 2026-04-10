"""SAT service type model."""

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatServiceType(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT service type model - categorizes types of assistance services."""

    __tablename__ = "sat_service_types"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<SatServiceType(id={self.id}, code={self.code}, name={self.name})>"
