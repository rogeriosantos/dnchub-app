"""Authentication schemas."""

from pydantic import EmailStr, Field

from app.shared.models.enums import UserRole
from app.shared.schemas.base import BaseSchema


class LoginRequest(BaseSchema):
    """Login request schema."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseSchema):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseSchema):
    """Refresh token request schema."""

    refresh_token: str


class TokenPayload(BaseSchema):
    """Token payload schema."""

    sub: str
    org_id: str | None = None
    role: UserRole | None = None
    type: str = "access"
    exp: int | None = None


class EmployeePinLoginRequest(BaseSchema):
    """Employee PIN login request for POS."""

    employee_id: str
    pin: str = Field(..., min_length=4, max_length=10)


class RegisterRequest(BaseSchema):
    """Registration request for new organization and admin user."""

    # Organization info
    organization_name: str = Field(..., min_length=2, max_length=100)

    # User info
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)


class EmployeePinResetRequest(BaseSchema):
    """Request to reset employee PIN and send via email/WhatsApp."""

    employee_id: str
    delivery_method: str = Field(..., pattern="^(email|whatsapp)$")


class EmployeePinResetResponse(BaseSchema):
    """Response for PIN reset request."""

    success: bool
    message: str
    delivery_method: str


class EmployeePinChangeRequest(BaseSchema):
    """Request to change employee PIN."""

    employee_id: str
    current_pin: str = Field(..., min_length=4, max_length=4)
    new_pin: str = Field(..., min_length=4, max_length=4)


class EmployeePinChangeResponse(BaseSchema):
    """Response for PIN change request."""

    success: bool
    message: str


class MessagingChannelsResponse(BaseSchema):
    """Response for available messaging channels."""

    channels: list[str]
    email_enabled: bool
    whatsapp_enabled: bool


class ForgotPasswordRequest(BaseSchema):
    """Request to initiate password reset."""

    email: EmailStr


class ForgotPasswordResponse(BaseSchema):
    """Response for forgot password request (always success to prevent enumeration)."""

    message: str


class ResetPasswordRequest(BaseSchema):
    """Request to complete password reset."""

    token: str
    new_password: str = Field(..., min_length=8)


class ResetPasswordResponse(BaseSchema):
    """Response for reset password request."""

    message: str
