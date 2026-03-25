"""Ticket schemas."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from app.shared.models.enums import PaymentMethod, TicketStatus, TicketType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class TicketBase(BaseSchema):
    """Base ticket schema."""

    ticket_number: str | None = Field(None, max_length=100)
    type: TicketType
    description: str | None = None
    violation_date: datetime
    violation_location: str | None = Field(None, max_length=500)
    issuing_authority: str | None = Field(None, max_length=255)
    amount: Decimal = Field(..., ge=0)
    due_date: date | None = None
    points_deducted: int | None = Field(None, ge=0)
    notes: str | None = None
    attachment_url: str | None = Field(None, max_length=500)


class TicketCreate(TicketBase):
    """Ticket creation schema."""

    organization_id: str | None = None  # Set by backend from auth token
    vehicle_id: str
    employee_id: str | None = None
    status: TicketStatus = TicketStatus.PENDING


class TicketUpdate(BaseSchema):
    """Ticket update schema."""

    ticket_number: str | None = Field(None, max_length=100)
    type: TicketType | None = None
    status: TicketStatus | None = None
    description: str | None = None
    violation_date: datetime | None = None
    violation_location: str | None = Field(None, max_length=500)
    issuing_authority: str | None = Field(None, max_length=255)
    amount: Decimal | None = Field(None, ge=0)
    due_date: date | None = None
    employee_id: str | None = None
    points_deducted: int | None = Field(None, ge=0)
    notes: str | None = None
    attachment_url: str | None = Field(None, max_length=500)


class TicketPayRequest(BaseSchema):
    """Request schema for marking ticket as paid."""

    paid_date: date
    paid_amount: Decimal = Field(..., ge=0)
    payment_method: PaymentMethod
    payment_reference: str | None = Field(None, max_length=255)


class TicketResponse(TicketBase, TimestampMixin, SoftDeleteMixin):
    """Ticket response schema."""

    id: str
    organization_id: str
    vehicle_id: str
    employee_id: str | None = None
    status: TicketStatus
    paid_date: date | None = None
    paid_amount: Decimal | None = None
    payment_method: PaymentMethod | None = None
    payment_reference: str | None = None


class TicketSummary(BaseSchema):
    """Ticket summary for list views."""

    id: str
    ticket_number: str | None = None
    type: TicketType
    status: TicketStatus
    violation_date: datetime
    amount: Decimal
    due_date: date | None = None
    vehicle_id: str
    employee_id: str | None = None


class TicketStats(BaseSchema):
    """Statistics summary for tickets."""

    total_count: int = 0
    pending_count: int = 0
    paid_count: int = 0
    overdue_count: int = 0
    appealed_count: int = 0
    cancelled_count: int = 0
    total_amount: Decimal = Decimal("0")
    total_paid: Decimal = Decimal("0")
    total_pending: Decimal = Decimal("0")
    total_overdue: Decimal = Decimal("0")
