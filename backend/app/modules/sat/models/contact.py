"""SAT contact model."""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatContact(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT contact model - contact persons for SAT customers."""

    __tablename__ = "sat_contacts"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_whatsapp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    customer: Mapped["SatCustomer"] = relationship(  # type: ignore[name-defined]
        back_populates="contacts",
    )

    def __repr__(self) -> str:
        return f"<SatContact(id={self.id}, name={self.name})>"
