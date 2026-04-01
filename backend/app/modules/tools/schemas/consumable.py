"""Consumable schemas."""

from datetime import date
from decimal import Decimal

from app.shared.models.enums import ConsumableStatus, ConsumableUnit
from app.shared.schemas.base import BaseSchema, TimestampMixin


class ConsumableBase(BaseSchema):
    """Base consumable schema."""

    erp_code: str
    name: str
    description: str | None = None
    brand: str | None = None
    model: str | None = None
    unit: ConsumableUnit = ConsumableUnit.PIECE
    current_quantity: int = 0
    minimum_quantity: int = 0
    reorder_quantity: int | None = None
    status: ConsumableStatus = ConsumableStatus.IN_STOCK
    case_id: str | None = None
    category_id: str | None = None
    location_id: str | None = None
    purchase_date: date | None = None
    purchase_price: Decimal | None = None
    notes: str | None = None


class ConsumableCreate(ConsumableBase):
    """Consumable creation schema."""

    organization_id: str | None = None  # Set by backend from auth token


class ConsumableUpdate(BaseSchema):
    """Consumable update schema — all fields optional."""

    erp_code: str | None = None
    name: str | None = None
    description: str | None = None
    brand: str | None = None
    model: str | None = None
    unit: ConsumableUnit | None = None
    current_quantity: int | None = None
    minimum_quantity: int | None = None
    reorder_quantity: int | None = None
    status: ConsumableStatus | None = None
    case_id: str | None = None
    category_id: str | None = None
    location_id: str | None = None
    purchase_date: date | None = None
    purchase_price: Decimal | None = None
    notes: str | None = None


class ConsumableAdjustQuantity(BaseSchema):
    """Schema for adjusting consumable quantity (add/remove stock)."""

    delta: int  # Positive to add stock, negative to remove
    notes: str | None = None


class ConsumableResponse(ConsumableBase, TimestampMixin):
    """Consumable response schema."""

    id: str
    organization_id: str


class ConsumableSummary(BaseSchema):
    """Lightweight consumable summary for listings."""

    id: str
    erp_code: str
    name: str
    unit: ConsumableUnit
    current_quantity: int
    minimum_quantity: int
    status: ConsumableStatus
    case_id: str | None = None
