"""User schemas."""

from datetime import datetime

from pydantic import EmailStr, Field

from app.shared.models.enums import DateFormatPreference, ThemePreference, UserRole
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class UserBase(BaseSchema):
    """Base user schema."""

    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.TECHNICIAN
    avatar: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    is_active: bool = True
    theme_preference: ThemePreference = ThemePreference.SYSTEM
    language: str = Field("en", max_length=10)
    date_format: DateFormatPreference = DateFormatPreference.MDY


class UserCreate(UserBase):
    """User creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseSchema):
    """User update schema."""

    email: EmailStr | None = None
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    role: UserRole | None = None
    avatar: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    is_active: bool | None = None
    theme_preference: ThemePreference | None = None
    language: str | None = Field(None, max_length=10)
    date_format: DateFormatPreference | None = None


class UserPasswordUpdate(BaseSchema):
    """User password update schema."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(UserBase, TimestampMixin, SoftDeleteMixin):
    """User response schema."""

    id: str
    organization_id: str
    last_login: datetime | None = None

    @property
    def full_name(self) -> str:
        """Get full name."""
        return f"{self.first_name} {self.last_name}"


class UserSummary(BaseSchema):
    """User summary for nested responses."""

    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole


class CurrentUser(BaseSchema):
    """Current authenticated user schema."""

    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    organization_id: str
    is_active: bool
    phone: str | None = None
