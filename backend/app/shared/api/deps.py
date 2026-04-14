"""API dependencies for authentication and authorization."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_token
from app.db import get_db
from app.shared.models.user import User
from app.shared.models.enums import UserRole
from app.shared.schemas.user import CurrentUser

security = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> CurrentUser:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    result = db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return CurrentUser(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        organization_id=user.organization_id,
        is_active=user.is_active,
        phone=user.phone,
    )


def get_current_active_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """Get current active user."""
    if not current_user.is_active:
        raise AuthenticationError("User account is disabled")
    return current_user


def require_role(*roles: UserRole):
    """Dependency factory for role-based access control."""

    def role_checker(
        current_user: Annotated[CurrentUser, Depends(get_current_active_user)],
    ) -> CurrentUser:
        if current_user.role not in roles:
            raise AuthorizationError(
                f"This action requires one of these roles: {', '.join(r.value for r in roles)}"
            )
        return current_user

    return role_checker


# Type aliases for common dependencies
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_active_user)]
AdminUserDep = Annotated[
    CurrentUser,
    Depends(require_role(UserRole.ADMIN)),
]
FleetManagerDep = Annotated[
    CurrentUser,
    Depends(require_role(UserRole.ADMIN, UserRole.FLEET_MANAGER)),
]
SatManagerDep = Annotated[
    CurrentUser,
    Depends(require_role(UserRole.ADMIN, UserRole.SAT_MANAGER)),
]
OperatorDep = Annotated[
    CurrentUser,
    Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.FLEET_MANAGER,
            UserRole.OPERATOR,
        )
    ),
]
DBDep = Annotated[Session, Depends(get_db)]
