"""Authentication service."""

import random
import string
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, ValidationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models import Employee, Organization, User
from app.models.enums import UserRole
from app.schemas import (
    EmployeePinChangeResponse,
    EmployeePinResetResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)


class AuthService:
    """Authentication service for user login and token management."""

    def authenticate_user(
        self,
        db: Session,
        login_data: LoginRequest,
    ) -> TokenResponse:
        """Authenticate user with email and password."""
        # Find user by email
        result = db.execute(
            select(User).where(
                User.email == login_data.email,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()

        if user is None:
            raise AuthenticationError("Invalid email or password")

        if not verify_password(login_data.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("User account is disabled")

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.add(user)
        db.flush()

        # Generate tokens
        access_token = create_access_token(
            subject=user.id,
            organization_id=user.organization_id,
            role=user.role.value,
        )
        refresh_token = create_refresh_token(subject=user.id)

        from app.core.config import settings

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )

    def refresh_access_token(
        self,
        db: Session,
        refresh_token: str,
    ) -> TokenResponse:
        """Refresh access token using refresh token."""
        payload = decode_token(refresh_token)

        if payload is None:
            raise AuthenticationError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        user_id = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("Invalid token payload")

        # Get user
        result = db.execute(
            select(User).where(
                User.id == user_id,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()

        if user is None:
            raise AuthenticationError("User not found")

        if not user.is_active:
            raise AuthenticationError("User account is disabled")

        # Generate new tokens
        access_token = create_access_token(
            subject=user.id,
            organization_id=user.organization_id,
            role=user.role.value,
        )
        new_refresh_token = create_refresh_token(subject=user.id)

        from app.core.config import settings

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )

    def authenticate_employee_pin(
        self,
        db: Session,
        employee_id: str,
        pin: str,
    ) -> TokenResponse:
        """Authenticate employee with employee ID and PIN for POS."""
        # Find employee by employee_id
        result = db.execute(
            select(Employee).where(
                Employee.employee_id == employee_id,
                Employee.deleted_at.is_(None),
            )
        )
        employee = result.scalar_one_or_none()

        if employee is None:
            raise AuthenticationError("Invalid employee ID or PIN")

        if employee.pin_code is None or employee.pin_code != pin:
            raise AuthenticationError("Invalid employee ID or PIN")

        # Generate limited access token for POS operations
        access_token = create_access_token(
            subject=employee.id,
            organization_id=employee.organization_id,
            role="technician",
        )
        refresh_token = create_refresh_token(subject=employee.id)

        from app.core.config import settings

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )

    def register(
        self,
        db: Session,
        register_data: RegisterRequest,
    ) -> TokenResponse:
        """Register a new organization with admin user."""
        # Check if email already exists
        result = db.execute(
            select(User).where(
                User.email == register_data.email,
                User.deleted_at.is_(None),
            )
        )
        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            raise ValidationError("A user with this email already exists")

        # Create organization
        organization = Organization(
            name=register_data.organization_name,
        )
        db.add(organization)
        db.flush()

        # Create admin user
        user = User(
            organization_id=organization.id,
            email=register_data.email,
            password_hash=get_password_hash(register_data.password),
            first_name=register_data.first_name,
            last_name=register_data.last_name,
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(user)
        db.flush()

        # Generate tokens
        access_token = create_access_token(
            subject=user.id,
            organization_id=organization.id,
            role=user.role.value,
        )
        refresh_token = create_refresh_token(subject=user.id)

        from app.core.config import settings

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )


    def reset_employee_pin(
        self,
        db: Session,
        employee_id: str,
        delivery_method: str,
    ) -> EmployeePinResetResponse:
        """Reset employee PIN and send via email or WhatsApp."""
        from app.shared.services.messaging import messaging_service

        # Find employee by employee_id
        result = db.execute(
            select(Employee).where(
                Employee.employee_id == employee_id,
                Employee.deleted_at.is_(None),
            )
        )
        employee = result.scalar_one_or_none()

        if employee is None:
            raise ValidationError("Employee not found with this employee ID")

        # Check if delivery method is available
        if delivery_method == "email":
            if not employee.email:
                raise ValidationError("Employee does not have an email address configured")
            from app.core.config import settings
            if not settings.email_enabled:
                raise ValidationError("Email service is not configured")
        elif delivery_method == "whatsapp":
            if not employee.phone:
                raise ValidationError("Employee does not have a phone number configured")
            from app.core.config import settings
            if not settings.whatsapp_enabled:
                raise ValidationError("WhatsApp service is not configured")
        else:
            raise ValidationError("Invalid delivery method")

        # Generate a new random 4-digit PIN
        new_pin = "".join(random.choices(string.digits, k=4))

        # Update employee's PIN and commit immediately
        employee.pin_code = new_pin
        db.add(employee)
        db.commit()

        # Send PIN via selected method (best effort - PIN is already saved)
        employee_name = f"{employee.first_name} {employee.last_name}"
        success = False

        if delivery_method == "email":
            success = messaging_service.send_pin_reset_email(
                to_email=employee.email,
                employee_name=employee_name,
                new_pin=new_pin,
            )
        elif delivery_method == "whatsapp":
            success = messaging_service.send_pin_reset_whatsapp(
                phone_number=employee.phone,
                employee_name=employee_name,
                new_pin=new_pin,
            )

        if not success:
            # PIN was saved but message failed - return partial success
            return EmployeePinResetResponse(
                success=True,
                message=f"PIN was reset but failed to send via {delivery_method}. Please try again or contact administrator.",
                delivery_method=delivery_method,
            )

        return EmployeePinResetResponse(
            success=True,
            message=f"New PIN has been sent via {delivery_method}",
            delivery_method=delivery_method,
        )

    def change_employee_pin(
        self,
        db: Session,
        employee_id: str,
        current_pin: str,
        new_pin: str,
    ) -> EmployeePinChangeResponse:
        """Change employee PIN after verifying current PIN."""
        from app.shared.services.messaging import messaging_service

        # Find employee by employee_id
        result = db.execute(
            select(Employee).where(
                Employee.employee_id == employee_id,
                Employee.deleted_at.is_(None),
            )
        )
        employee = result.scalar_one_or_none()

        if employee is None:
            raise AuthenticationError("Invalid employee ID or PIN")

        # Verify current PIN
        if employee.pin_code is None or employee.pin_code != current_pin:
            raise AuthenticationError("Current PIN is incorrect")

        # Validate new PIN
        if len(new_pin) != 4 or not new_pin.isdigit():
            raise ValidationError("New PIN must be exactly 4 digits")

        if new_pin == current_pin:
            raise ValidationError("New PIN must be different from current PIN")

        # Update employee's PIN
        employee.pin_code = new_pin
        db.add(employee)
        db.flush()

        # Send confirmation notifications (best effort, don't fail if notification fails)
        employee_name = f"{employee.first_name} {employee.last_name}"

        if employee.email:
            messaging_service.send_pin_changed_email(
                to_email=employee.email,
                employee_name=employee_name,
            )

        if employee.phone:
            messaging_service.send_pin_changed_whatsapp(
                phone_number=employee.phone,
                employee_name=employee_name,
            )

        return EmployeePinChangeResponse(
            success=True,
            message="PIN has been changed successfully",
        )


auth_service = AuthService()
