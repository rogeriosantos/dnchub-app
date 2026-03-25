"""Ticket service."""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Ticket, TicketStatus, TicketType
from app.schemas import TicketCreate, TicketPayRequest, TicketStats, TicketUpdate
from app.shared.services.base import BaseService


class TicketService(BaseService[Ticket, TicketCreate, TicketUpdate]):
    """Ticket service with specialized operations."""

    def __init__(self):
        super().__init__(Ticket)

    def get_by_ticket_number(
        self,
        db: Session,
        ticket_number: str,
        organization_id: str,
    ) -> Ticket | None:
        """Get ticket by external ticket number within an organization."""
        result = db.execute(
            select(Ticket).where(
                Ticket.ticket_number == ticket_number,
                Ticket.organization_id == organization_id,
                Ticket.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def get_by_vehicle(
        self,
        db: Session,
        vehicle_id: str,
        organization_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Ticket]:
        """Get all tickets for a specific vehicle."""
        result = db.execute(
            select(Ticket).where(
                Ticket.vehicle_id == vehicle_id,
                Ticket.organization_id == organization_id,
                Ticket.deleted_at.is_(None),
            ).offset(skip).limit(limit).order_by(Ticket.violation_date.desc())
        )
        return list(result.scalars().all())

    def get_by_employee(
        self,
        db: Session,
        employee_id: str,
        organization_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Ticket]:
        """Get all tickets for a specific employee."""
        result = db.execute(
            select(Ticket).where(
                Ticket.employee_id == employee_id,
                Ticket.organization_id == organization_id,
                Ticket.deleted_at.is_(None),
            ).offset(skip).limit(limit).order_by(Ticket.violation_date.desc())
        )
        return list(result.scalars().all())

    def get_by_status(
        self,
        db: Session,
        organization_id: str,
        status: TicketStatus,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Ticket]:
        """Get tickets by status."""
        result = db.execute(
            select(Ticket).where(
                Ticket.organization_id == organization_id,
                Ticket.status == status,
                Ticket.deleted_at.is_(None),
            ).offset(skip).limit(limit).order_by(Ticket.violation_date.desc())
        )
        return list(result.scalars().all())

    def get_by_type(
        self,
        db: Session,
        organization_id: str,
        ticket_type: TicketType,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Ticket]:
        """Get tickets by type."""
        result = db.execute(
            select(Ticket).where(
                Ticket.organization_id == organization_id,
                Ticket.type == ticket_type,
                Ticket.deleted_at.is_(None),
            ).offset(skip).limit(limit).order_by(Ticket.violation_date.desc())
        )
        return list(result.scalars().all())

    def get_overdue(
        self,
        db: Session,
        organization_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Ticket]:
        """Get overdue tickets (past due date and not paid/cancelled)."""
        today = date.today()
        result = db.execute(
            select(Ticket).where(
                Ticket.organization_id == organization_id,
                Ticket.due_date < today,
                Ticket.status.in_([TicketStatus.PENDING, TicketStatus.APPEALED]),
                Ticket.deleted_at.is_(None),
            ).offset(skip).limit(limit).order_by(Ticket.due_date.asc())
        )
        return list(result.scalars().all())

    def get_multi_filtered(
        self,
        db: Session,
        organization_id: str,
        *,
        status: TicketStatus | None = None,
        ticket_type: TicketType | None = None,
        vehicle_id: str | None = None,
        employee_id: str | None = None,
        overdue_only: bool = False,
        start_date: date | None = None,
        end_date: date | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Ticket]:
        """Get tickets with multiple filters."""
        query = select(Ticket).where(
            Ticket.organization_id == organization_id,
            Ticket.deleted_at.is_(None),
        )

        if status is not None:
            query = query.where(Ticket.status == status)

        if ticket_type is not None:
            query = query.where(Ticket.type == ticket_type)

        if vehicle_id is not None:
            query = query.where(Ticket.vehicle_id == vehicle_id)

        if employee_id is not None:
            query = query.where(Ticket.employee_id == employee_id)

        if overdue_only:
            today = date.today()
            query = query.where(
                Ticket.due_date < today,
                Ticket.status.in_([TicketStatus.PENDING, TicketStatus.APPEALED]),
            )

        if start_date is not None:
            query = query.where(Ticket.violation_date >= datetime.combine(start_date, datetime.min.time()))

        if end_date is not None:
            query = query.where(Ticket.violation_date <= datetime.combine(end_date, datetime.max.time()))

        result = db.execute(
            query.offset(skip).limit(limit).order_by(Ticket.violation_date.desc())
        )
        return list(result.scalars().all())

    def mark_as_paid(
        self,
        db: Session,
        ticket: Ticket,
        payment_data: TicketPayRequest,
    ) -> Ticket:
        """Mark a ticket as paid with payment details."""
        ticket.status = TicketStatus.PAID
        ticket.paid_date = payment_data.paid_date
        ticket.paid_amount = payment_data.paid_amount
        ticket.payment_method = payment_data.payment_method
        ticket.payment_reference = payment_data.payment_reference

        db.add(ticket)
        db.flush()
        db.refresh(ticket)
        return ticket

    def update_status(
        self,
        db: Session,
        ticket: Ticket,
        new_status: TicketStatus,
    ) -> Ticket:
        """Update ticket status."""
        ticket.status = new_status
        db.add(ticket)
        db.flush()
        db.refresh(ticket)
        return ticket

    def get_stats(
        self,
        db: Session,
        organization_id: str,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> TicketStats:
        """Get ticket statistics for an organization."""
        today = date.today()

        # Base query
        base_query = select(Ticket).where(
            Ticket.organization_id == organization_id,
            Ticket.deleted_at.is_(None),
        )

        if start_date is not None:
            base_query = base_query.where(
                Ticket.violation_date >= datetime.combine(start_date, datetime.min.time())
            )
        if end_date is not None:
            base_query = base_query.where(
                Ticket.violation_date <= datetime.combine(end_date, datetime.max.time())
            )

        # Get all tickets matching the date range
        result = db.execute(base_query)
        tickets = list(result.scalars().all())

        # Calculate stats
        total_count = len(tickets)
        pending_count = 0
        paid_count = 0
        overdue_count = 0
        appealed_count = 0
        cancelled_count = 0
        total_amount = Decimal("0")
        total_paid = Decimal("0")
        total_pending = Decimal("0")
        total_overdue = Decimal("0")

        for ticket in tickets:
            total_amount += ticket.amount or Decimal("0")

            if ticket.status == TicketStatus.PENDING:
                pending_count += 1
                total_pending += ticket.amount or Decimal("0")
                # Check if overdue
                if ticket.due_date and ticket.due_date < today:
                    overdue_count += 1
                    total_overdue += ticket.amount or Decimal("0")
            elif ticket.status == TicketStatus.PAID:
                paid_count += 1
                total_paid += ticket.paid_amount or ticket.amount or Decimal("0")
            elif ticket.status == TicketStatus.APPEALED:
                appealed_count += 1
                # Check if overdue
                if ticket.due_date and ticket.due_date < today:
                    overdue_count += 1
                    total_overdue += ticket.amount or Decimal("0")
            elif ticket.status == TicketStatus.CANCELLED:
                cancelled_count += 1
            elif ticket.status == TicketStatus.OVERDUE:
                overdue_count += 1
                total_overdue += ticket.amount or Decimal("0")

        return TicketStats(
            total_count=total_count,
            pending_count=pending_count,
            paid_count=paid_count,
            overdue_count=overdue_count,
            appealed_count=appealed_count,
            cancelled_count=cancelled_count,
            total_amount=total_amount,
            total_paid=total_paid,
            total_pending=total_pending,
            total_overdue=total_overdue,
        )


ticket_service = TicketService()
