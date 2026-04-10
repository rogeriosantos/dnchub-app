"""SAT customer service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sat.models.customer import SatCustomer
from app.modules.sat.schemas.customer import SatCustomerCreate, SatCustomerUpdate
from app.shared.services.base import BaseService


class SatCustomerService(BaseService[SatCustomer, SatCustomerCreate, SatCustomerUpdate]):
    """SAT customer service with search capabilities."""

    def __init__(self):
        super().__init__(SatCustomer)

    def search(
        self,
        db: Session,
        *,
        organization_id: str,
        query: str | None = None,
        city: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SatCustomer]:
        """Search customers by name and/or city."""
        stmt = select(SatCustomer).where(
            SatCustomer.organization_id == organization_id,
            SatCustomer.deleted_at.is_(None),
        )
        if query:
            stmt = stmt.where(SatCustomer.name.ilike(f"%{query}%"))
        if city:
            stmt = stmt.where(SatCustomer.city.ilike(f"%{city}%"))
        stmt = stmt.offset(skip).limit(limit)
        result = db.execute(stmt)
        return list(result.scalars().all())


sat_customer_service = SatCustomerService()
