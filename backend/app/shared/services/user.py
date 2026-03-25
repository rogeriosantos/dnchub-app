"""User service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ValidationError
from app.core.security import get_password_hash, verify_password
from app.models import User
from app.schemas import UserCreate, UserPasswordUpdate, UserUpdate
from app.shared.services.base import BaseService


class UserService(BaseService[User, UserCreate, UserUpdate]):
    """User service with specialized operations."""

    def __init__(self):
        super().__init__(User)

    def get_by_email(
        self,
        db: Session,
        email: str,
        organization_id: str,
    ) -> User | None:
        """Get user by email within an organization."""
        result = db.execute(
            select(User).where(
                User.email == email,
                User.organization_id == organization_id,
                User.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: UserCreate,
    ) -> User:
        """Create a new user with hashed password."""
        # Check for existing user with same email in organization
        existing = self.get_by_email(
            db,
            email=obj_in.email,
            organization_id=obj_in.organization_id,
        )
        if existing:
            raise ConflictError(
                message="User with this email already exists",
                details={"email": obj_in.email},
            )

        # Hash password
        user_data = obj_in.model_dump(exclude={"password"})
        user_data["password_hash"] = get_password_hash(obj_in.password)

        db_obj = User(**user_data)
        db.add(db_obj)
        db.flush()
        db.refresh(db_obj)
        return db_obj

    def update_password(
        self,
        db: Session,
        *,
        user: User,
        password_update: UserPasswordUpdate,
    ) -> User:
        """Update user password."""
        # Verify current password
        if not verify_password(password_update.current_password, user.password_hash):
            raise ValidationError(
                message="Current password is incorrect",
                details={"current_password": "Invalid password"},
            )

        # Update to new password
        user.password_hash = get_password_hash(password_update.new_password)
        db.add(user)
        db.flush()
        db.refresh(user)
        return user

    def get_users_by_organization(
        self,
        db: Session,
        organization_id: str,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[User]:
        """Get all users in an organization."""
        return self.get_multi(
            db,
            skip=skip,
            limit=limit,
            organization_id=organization_id,
        )


user_service = UserService()
