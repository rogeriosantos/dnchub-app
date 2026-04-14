"""Employee schemas."""

from datetime import date
from decimal import Decimal

from pydantic import EmailStr, Field

from app.shared.models.enums import EmployeeStatus
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class EmployeeBase(BaseSchema):
    """Base employee schema."""

    employee_id: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=50)
    avatar: str | None = Field(None, max_length=500)
    status: EmployeeStatus = EmployeeStatus.AVAILABLE
    license_number: str = Field(..., min_length=1, max_length=100)
    license_issue_date: date | None = None
    license_expiry: date
    license_class: str = Field(..., min_length=1, max_length=20)
    date_of_birth: date | None = None
    hire_date: date
    address: str | None = None
    emergency_contact: str | None = Field(None, max_length=255)
    emergency_phone: str | None = Field(None, max_length=50)
    notes: str | None = None


class EmployeeCreate(EmployeeBase):
    """Employee creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    user_id: str | None = None
    assigned_vehicle_id: str | None = None
    cost_center_id: str | None = None
    pin_code: str | None = Field(None, min_length=4, max_length=10)
    is_backoffice: bool = False
    is_sat_technician: bool = False


class EmployeeUpdate(BaseSchema):
    """Employee update schema."""

    employee_id: str | None = Field(None, min_length=1, max_length=50)
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, min_length=1, max_length=50)
    avatar: str | None = Field(None, max_length=500)
    status: EmployeeStatus | None = None
    license_number: str | None = Field(None, min_length=1, max_length=100)
    license_issue_date: date | None = None
    license_expiry: date | None = None
    license_class: str | None = Field(None, min_length=1, max_length=20)
    date_of_birth: date | None = None
    hire_date: date | None = None
    address: str | None = None
    emergency_contact: str | None = Field(None, max_length=255)
    emergency_phone: str | None = Field(None, max_length=50)
    notes: str | None = None
    user_id: str | None = None
    assigned_vehicle_id: str | None = None
    cost_center_id: str | None = None
    pin_code: str | None = Field(None, min_length=4, max_length=10)
    is_backoffice: bool | None = None
    is_sat_technician: bool | None = None


class EmployeeResponse(EmployeeBase, TimestampMixin, SoftDeleteMixin):
    """Employee response schema."""

    id: str
    organization_id: str
    user_id: str | None = None
    assigned_vehicle_id: str | None = None
    cost_center_id: str | None = None
    total_trips: int = 0
    total_distance: Decimal = Decimal("0")
    fuel_efficiency_score: Decimal | None = None
    safety_score: Decimal | None = None
    is_backoffice: bool = False
    is_sat_technician: bool = False

    @property
    def full_name(self) -> str:
        """Get full name."""
        return f"{self.first_name} {self.last_name}"


class EmployeeSummary(BaseSchema):
    """Employee summary for nested responses."""

    id: str
    employee_id: str
    first_name: str
    last_name: str
    status: EmployeeStatus
    license_expiry: date


class EmployeePerformance(BaseSchema):
    """Employee performance metrics."""

    id: str
    first_name: str
    last_name: str
    total_trips: int
    total_distance: Decimal
    fuel_efficiency_score: Decimal | None
    safety_score: Decimal | None
    average_speed: Decimal | None = None
    total_violations: int = 0
