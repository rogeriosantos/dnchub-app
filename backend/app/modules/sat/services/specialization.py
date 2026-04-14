"""SAT specialization service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.modules.sat.models.specialization import SatSpecialization
from app.modules.sat.schemas.specialization import SatSpecializationCreate, SatSpecializationUpdate
from app.shared.services.base import BaseService


class SatSpecializationService(BaseService[SatSpecialization, SatSpecializationCreate, SatSpecializationUpdate]):
    """SAT specialization service with unique code validation."""

    def __init__(self):
        super().__init__(SatSpecialization)

    def get_by_code(
        self,
        db: Session,
        code: str,
        organization_id: str,
    ) -> SatSpecialization | None:
        """Get specialization by code within an organization."""
        result = db.execute(
            select(SatSpecialization).where(
                SatSpecialization.code == code,
                SatSpecialization.organization_id == organization_id,
                SatSpecialization.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def create(
        self,
        db: Session,
        *,
        obj_in: SatSpecializationCreate,
    ) -> SatSpecialization:
        """Create a new specialization with unique code validation."""
        existing = self.get_by_code(
            db,
            code=obj_in.code,
            organization_id=obj_in.organization_id,
        )
        if existing:
            raise ConflictError(
                message="Specialization with this code already exists",
                details={"code": obj_in.code},
            )
        return super().create(db, obj_in=obj_in)


sat_specialization_service = SatSpecializationService()
