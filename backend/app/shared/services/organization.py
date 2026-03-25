"""Organization service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.models import Organization
from app.schemas import OrganizationCreate, OrganizationUpdate
from app.shared.services.base import BaseService


class OrganizationService(BaseService[Organization, OrganizationCreate, OrganizationUpdate]):
    """Organization service."""

    def __init__(self):
        super().__init__(Organization)

    def get_by_slug(
        self,
        db: Session,
        slug: str,
    ) -> Organization | None:
        """Get organization by slug."""
        result = db.execute(
            select(Organization).where(
                Organization.slug == slug,
                Organization.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: OrganizationCreate,
    ) -> Organization:
        """Create an organization with unique slug validation."""
        existing = self.get_by_slug(db, slug=obj_in.slug)
        if existing:
            raise ConflictError(
                message="Organization with this slug already exists",
                details={"slug": obj_in.slug},
            )

        return super().create(db, obj_in=obj_in)

    def get_active_organizations(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Organization]:
        """Get active organizations."""
        result = db.execute(
            select(Organization)
            .where(
                Organization.is_active == True,
                Organization.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def deactivate(
        self,
        db: Session,
        organization: Organization,
    ) -> Organization:
        """Deactivate an organization."""
        organization.is_active = False
        db.add(organization)
        db.flush()
        db.refresh(organization)
        return organization

    def activate(
        self,
        db: Session,
        organization: Organization,
    ) -> Organization:
        """Activate an organization."""
        organization.is_active = True
        db.add(organization)
        db.flush()
        db.refresh(organization)
        return organization


organization_service = OrganizationService()
