"""User model."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import DateFormatPreference, ThemePreference, UserRole


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """User model - system users with role-based access control."""

    __tablename__ = "users"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserRole.TECHNICIAN,
    )
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Appearance settings
    theme_preference: Mapped[ThemePreference] = mapped_column(
        Enum(ThemePreference, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ThemePreference.SYSTEM,
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    date_format: Mapped[DateFormatPreference] = mapped_column(
        Enum(DateFormatPreference, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DateFormatPreference.MDY,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        back_populates="users",
    )
    notifications: Mapped[list["Notification"]] = relationship(  # type: ignore[name-defined]
        back_populates="user",
        lazy="selectin",
    )
    notification_preferences: Mapped["NotificationPreferences"] = relationship(  # type: ignore[name-defined]
        back_populates="user",
        uselist=False,
        lazy="noload",
    )

    @property
    def full_name(self) -> str:
        """Get full name of user."""
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
