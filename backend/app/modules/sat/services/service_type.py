"""SAT service type service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.modules.sat.models.service_type import SatServiceType
from app.modules.sat.schemas.service_type import SatServiceTypeCreate, SatServiceTypeUpdate
from app.shared.services.base import BaseService


class SatServiceTypeService(BaseService[SatServiceType, SatServiceTypeCreate, SatServiceTypeUpdate]):
    """SAT service type service with unique code validation."""

    def __init__(self):
        super().__init__(SatServiceType)

    def get_by_code(
        self,
        db: Session,
        code: str,
        organization_id: str,
    ) -> SatServiceType | None:
        """Get service type by code within an organization."""
        result = db.execute(
            select(SatServiceType).where(
                SatServiceType.code == code,
                SatServiceType.organization_id == organization_id,
                SatServiceType.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: SatServiceTypeCreate,
    ) -> SatServiceType:
        """Create a new service type with unique code validation."""
        existing = self.get_by_code(
            db,
            code=obj_in.code,
            organization_id=obj_in.organization_id,
        )
        if existing:
            raise ConflictError(
                message="Service type with this code already exists",
                details={"code": obj_in.code},
            )
        return super().create(db, obj_in=obj_in)


sat_service_type_service = SatServiceTypeService()
