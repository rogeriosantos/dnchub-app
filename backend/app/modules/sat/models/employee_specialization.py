"""SAT employee-specialization junction model."""

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SatEmployeeSpecialization(Base):
    """Junction table linking employees to SAT specializations."""

    __tablename__ = "sat_employee_specializations"

    employee_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="CASCADE"),
        primary_key=True,
    )
    specialization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_specializations.id", ondelete="CASCADE"),
        primary_key=True,
    )

    def __repr__(self) -> str:
        return (
            f"<SatEmployeeSpecialization("
            f"employee={self.employee_id}, "
            f"specialization={self.specialization_id})>"
        )
