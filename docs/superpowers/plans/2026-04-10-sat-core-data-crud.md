# SAT Module — Core Data & CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the SAT (Service & Assistance Tracking) module with 9 database tables, full REST API, and frontend CRUD pages following existing Fleet/Tools patterns.

**Architecture:** New backend module at `backend/app/modules/sat/` with models, schemas, services, and API routes. Frontend pages at `frontend/src/app/(dashboard)/sat/`. Extends the existing Employee model with `is_sat_technician`. All entities use org-scoped soft-delete, UUID PKs, and BaseService.

**Tech Stack:** Python 3.12 / FastAPI / SQLAlchemy 2.0 / Alembic / Pydantic v2 / Next.js / TypeScript / shadcn/ui / react-i18next

**Spec:** `docs/superpowers/specs/2026-04-10-sat-core-data-crud-design.md`

---

## File Structure

### Backend — New Files

```
backend/app/modules/sat/
├── __init__.py
├── api/
│   ├── __init__.py                    # sat_router aggregation
│   ├── customers.py                   # Customer CRUD
│   ├── contacts.py                    # Contact endpoints
│   ├── machines.py                    # Machine CRUD
│   ├── assistances.py                 # Assistance CRUD + status
│   ├── reports.py                     # InterventionReport CRUD
│   ├── attachments.py                 # Attachment upload/delete
│   ├── technicians.py                 # Read-only technician list
│   ├── service_types.py               # ServiceType CRUD
│   └── specializations.py            # Specialization CRUD
├── models/
│   ├── __init__.py
│   ├── customer.py                    # SatCustomer model
│   ├── contact.py                     # SatContact model
│   ├── machine.py                     # SatMachine model
│   ├── assistance.py                  # SatAssistance model
│   ├── intervention_report.py         # SatInterventionReport model
│   ├── attachment.py                  # SatAttachment model
│   ├── service_type.py                # SatServiceType model
│   ├── specialization.py             # SatSpecialization + junction
│   └── employee_specialization.py     # SatEmployeeSpecialization junction
├── schemas/
│   ├── __init__.py
│   ├── customer.py
│   ├── contact.py
│   ├── machine.py
│   ├── assistance.py
│   ├── intervention_report.py
│   ├── attachment.py
│   ├── service_type.py
│   └── specialization.py
└── services/
    ├── __init__.py
    ├── customer.py
    ├── contact.py
    ├── machine.py
    ├── assistance.py
    ├── intervention_report.py
    ├── attachment.py
    ├── service_type.py
    └── specialization.py
```

### Backend — Modified Files

```
backend/app/shared/models/enums.py              # Add SAT enums
backend/app/shared/models/employee.py            # Add is_sat_technician column
backend/app/shared/api/deps.py                   # Add SatManagerDep
backend/app/api/v1/__init__.py                   # Register sat_router
backend/app/models/__init__.py                   # Re-export SAT models
backend/app/schemas/__init__.py                  # Re-export SAT schemas
backend/app/services/__init__.py                 # Re-export SAT services
backend/alembic/versions/XXXXXXXX_add_sat_module.py  # Migration
```

### Backend — New Test Files

```
backend/tests/smoke/test_sat_customers.py
backend/tests/smoke/test_sat_contacts.py
backend/tests/smoke/test_sat_machines.py
backend/tests/smoke/test_sat_assistances.py
backend/tests/smoke/test_sat_reports.py
backend/tests/smoke/test_sat_service_types.py
backend/tests/smoke/test_sat_specializations.py
backend/tests/conftest.py                        # Add sat_manager fixture
```

### Frontend — New Files

```
frontend/src/lib/api/sat-customers.ts
frontend/src/lib/api/sat-machines.ts
frontend/src/lib/api/sat-assistances.ts
frontend/src/lib/api/sat-reports.ts
frontend/src/lib/api/sat-contacts.ts
frontend/src/lib/api/sat-attachments.ts
frontend/src/lib/api/sat-service-types.ts
frontend/src/lib/api/sat-specializations.ts
frontend/src/lib/api/sat-technicians.ts
frontend/src/app/(dashboard)/sat/page.tsx
frontend/src/app/(dashboard)/sat/loading.tsx
frontend/src/app/(dashboard)/sat/error.tsx
frontend/src/app/(dashboard)/sat/customers/page.tsx
frontend/src/app/(dashboard)/sat/customers/new/page.tsx
frontend/src/app/(dashboard)/sat/customers/[id]/page.tsx
frontend/src/app/(dashboard)/sat/customers/[id]/edit/page.tsx
frontend/src/app/(dashboard)/sat/machines/page.tsx
frontend/src/app/(dashboard)/sat/machines/new/page.tsx
frontend/src/app/(dashboard)/sat/machines/[id]/page.tsx
frontend/src/app/(dashboard)/sat/machines/[id]/edit/page.tsx
frontend/src/app/(dashboard)/sat/assistances/page.tsx
frontend/src/app/(dashboard)/sat/assistances/new/page.tsx
frontend/src/app/(dashboard)/sat/assistances/[id]/page.tsx
frontend/src/app/(dashboard)/sat/assistances/[id]/edit/page.tsx
frontend/src/app/(dashboard)/sat/reports/page.tsx
frontend/src/app/(dashboard)/sat/reports/new/page.tsx
frontend/src/app/(dashboard)/sat/reports/[id]/page.tsx
frontend/src/app/(dashboard)/sat/reports/[id]/edit/page.tsx
frontend/src/app/(dashboard)/sat/technicians/page.tsx
frontend/src/app/(dashboard)/sat/technicians/[id]/page.tsx
frontend/src/app/(dashboard)/sat/settings/service-types/page.tsx
frontend/src/app/(dashboard)/sat/settings/service-types/new/page.tsx
frontend/src/app/(dashboard)/sat/settings/service-types/[id]/edit/page.tsx
frontend/src/app/(dashboard)/sat/settings/specializations/page.tsx
frontend/src/app/(dashboard)/sat/settings/specializations/new/page.tsx
frontend/src/app/(dashboard)/sat/settings/specializations/[id]/edit/page.tsx
```

### Frontend — Modified Files

```
frontend/src/types/index.ts                      # Add SAT types
frontend/src/lib/api/index.ts                    # Export SAT services
frontend/src/lib/api/transformers.ts             # Add SAT transformers
frontend/src/data/mock-data.ts                   # Add satNavigation
frontend/src/components/layout/app-shell.tsx     # Add SAT module detection
frontend/src/lib/i18n/locales/en.json            # Add SAT i18n keys
frontend/src/lib/i18n/locales/pt.json            # Add SAT i18n keys
```

---

## Task 1: Add SAT enums to shared enums

**Files:**
- Modify: `backend/app/shared/models/enums.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Add SAT enum classes to `backend/app/shared/models/enums.py`**

Append after the last enum class (`ConsumableUnit`):

```python
class AssistanceStatus(str, Enum):
    """SAT assistance status enumeration."""

    REQUESTED = "requested"
    SCHEDULED = "scheduled"
    EN_ROUTE = "en_route"
    ON_SITE = "on_site"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    CANCELLED = "cancelled"


class AssistancePriority(str, Enum):
    """SAT assistance priority enumeration."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MachineType(str, Enum):
    """SAT machine type enumeration."""

    CNC = "cnc"
    SOFTWARE = "software"


class ReportStatus(str, Enum):
    """SAT intervention report status enumeration."""

    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"


class AttachmentFileType(str, Enum):
    """SAT attachment file type enumeration."""

    PHOTO = "photo"
    AUDIO = "audio"
    DOCUMENT = "document"


class AttachmentSource(str, Enum):
    """SAT attachment source enumeration."""

    WHATSAPP = "whatsapp"
    WEB_UPLOAD = "web_upload"
```

- [ ] **Step 2: Add `SAT_MANAGER` to the existing `UserRole` enum**

In `backend/app/shared/models/enums.py`, find the `UserRole` class and add `SAT_MANAGER`:

```python
class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    OPERATOR = "operator"
    VIEWER = "viewer"
    TECHNICIAN = "technician"
    SAT_MANAGER = "sat_manager"
```

- [ ] **Step 3: Add SAT enum re-exports to `backend/app/models/__init__.py`**

Add these imports from enums:

```python
from app.shared.models.enums import (
    # ... existing imports ...
    AssistanceStatus,
    AssistancePriority,
    MachineType,
    ReportStatus,
    AttachmentFileType,
    AttachmentSource,
)
```

And add to `__all__`:

```python
    "AssistanceStatus",
    "AssistancePriority",
    "MachineType",
    "ReportStatus",
    "AttachmentFileType",
    "AttachmentSource",
```

- [ ] **Step 4: Add `SatManagerDep` to `backend/app/shared/api/deps.py`**

Add after `FleetManagerDep`:

```python
SatManagerDep = Annotated[
    CurrentUser,
    Depends(require_role(UserRole.ADMIN, UserRole.SAT_MANAGER)),
]
```

- [ ] **Step 5: Verify imports compile**

Run: `cd backend && python -c "from app.shared.models.enums import AssistanceStatus, UserRole; print('OK')"`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add backend/app/shared/models/enums.py backend/app/models/__init__.py backend/app/shared/api/deps.py
git commit -m "feat(sat): add SAT enums, UserRole.SAT_MANAGER, and SatManagerDep"
```

---

## Task 2: Create SAT backend models

**Files:**
- Create: `backend/app/modules/sat/__init__.py`
- Create: `backend/app/modules/sat/models/__init__.py`
- Create: `backend/app/modules/sat/models/service_type.py`
- Create: `backend/app/modules/sat/models/specialization.py`
- Create: `backend/app/modules/sat/models/employee_specialization.py`
- Create: `backend/app/modules/sat/models/customer.py`
- Create: `backend/app/modules/sat/models/contact.py`
- Create: `backend/app/modules/sat/models/machine.py`
- Create: `backend/app/modules/sat/models/assistance.py`
- Create: `backend/app/modules/sat/models/intervention_report.py`
- Create: `backend/app/modules/sat/models/attachment.py`
- Modify: `backend/app/shared/models/employee.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create module directories**

```bash
mkdir -p backend/app/modules/sat/{api,models,schemas,services}
touch backend/app/modules/sat/__init__.py
touch backend/app/modules/sat/models/__init__.py
touch backend/app/modules/sat/schemas/__init__.py
touch backend/app/modules/sat/services/__init__.py
touch backend/app/modules/sat/api/__init__.py
```

- [ ] **Step 2: Create `backend/app/modules/sat/models/service_type.py`**

```python
"""SAT service type reference model."""

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatServiceType(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT service type - configurable reference table."""

    __tablename__ = "sat_service_types"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<SatServiceType(id={self.id}, code={self.code})>"
```

- [ ] **Step 3: Create `backend/app/modules/sat/models/specialization.py`**

```python
"""SAT specialization reference model."""

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatSpecialization(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT specialization - configurable reference table."""

    __tablename__ = "sat_specializations"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<SatSpecialization(id={self.id}, code={self.code})>"
```

- [ ] **Step 4: Create `backend/app/modules/sat/models/employee_specialization.py`**

```python
"""SAT employee-specialization junction table."""

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
        return f"<SatEmployeeSpecialization(employee={self.employee_id}, spec={self.specialization_id})>"
```

- [ ] **Step 5: Create `backend/app/modules/sat/models/customer.py`**

```python
"""SAT customer model."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatCustomer(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT customer - companies receiving field service."""

    __tablename__ = "sat_customers"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    phc_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    contacts: Mapped[list["SatContact"]] = relationship(  # type: ignore[name-defined]
        back_populates="customer",
        lazy="selectin",
    )
    machines: Mapped[list["SatMachine"]] = relationship(  # type: ignore[name-defined]
        back_populates="customer",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<SatCustomer(id={self.id}, name={self.name})>"
```

- [ ] **Step 6: Create `backend/app/modules/sat/models/contact.py`**

```python
"""SAT contact model."""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class SatContact(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT contact - people at customer sites."""

    __tablename__ = "sat_contacts"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_whatsapp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    customer: Mapped["SatCustomer"] = relationship(back_populates="contacts")

    def __repr__(self) -> str:
        return f"<SatContact(id={self.id}, name={self.name})>"
```

- [ ] **Step 7: Create `backend/app/modules/sat/models/machine.py`**

```python
"""SAT machine model."""

from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import MachineType


class SatMachine(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT machine - equipment at customer sites."""

    __tablename__ = "sat_machines"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    machine_type: Mapped[MachineType] = mapped_column(
        Enum(MachineType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    installation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    customer: Mapped["SatCustomer"] = relationship(back_populates="machines")

    @property
    def display_name(self) -> str:
        """Get display name for machine."""
        parts = [p for p in [self.brand, self.model] if p]
        name = " ".join(parts) if parts else "Unknown"
        if self.serial_number:
            name += f" ({self.serial_number})"
        return name

    def __repr__(self) -> str:
        return f"<SatMachine(id={self.id}, type={self.machine_type})>"
```

- [ ] **Step 8: Create `backend/app/modules/sat/models/assistance.py`**

```python
"""SAT assistance model."""

from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import AssistancePriority, AssistanceStatus


class SatAssistance(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT assistance - service request/intervention record."""

    __tablename__ = "sat_assistances"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    phc_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    machine_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_machines.id", ondelete="SET NULL"),
        nullable=True,
    )
    technician_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    service_type_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_service_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    priority: Mapped[AssistancePriority] = mapped_column(
        Enum(AssistancePriority, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssistancePriority.MEDIUM,
    )
    status: Mapped[AssistanceStatus] = mapped_column(
        Enum(AssistanceStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssistanceStatus.REQUESTED,
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    problem_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sla_response_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sla_resolution_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    customer: Mapped["SatCustomer"] = relationship()  # type: ignore[name-defined]
    machine: Mapped["SatMachine | None"] = relationship()  # type: ignore[name-defined]
    technician: Mapped["Employee | None"] = relationship()  # type: ignore[name-defined]
    service_type: Mapped["SatServiceType"] = relationship()  # type: ignore[name-defined]
    report: Mapped["SatInterventionReport | None"] = relationship(  # type: ignore[name-defined]
        back_populates="assistance",
        uselist=False,
        lazy="selectin",
    )
    attachments: Mapped[list["SatAttachment"]] = relationship(  # type: ignore[name-defined]
        primaryjoin="SatAssistance.id == foreign(SatAttachment.assistance_id)",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<SatAssistance(id={self.id}, status={self.status})>"
```

- [ ] **Step 9: Create `backend/app/modules/sat/models/intervention_report.py`**

```python
"""SAT intervention report model."""

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import ReportStatus


class SatInterventionReport(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT intervention report - detailed record filed after work."""

    __tablename__ = "sat_intervention_reports"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    assistance_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_assistances.id", ondelete="CASCADE"),
        nullable=False,
    )
    technician_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
    )
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    actions_taken: Mapped[str | None] = mapped_column(Text, nullable=True)
    parts_replaced: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    time_travel_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_onsite_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    next_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_raw_transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_structured_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_signature_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    report_status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ReportStatus.DRAFT,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()  # type: ignore[name-defined]
    assistance: Mapped["SatAssistance"] = relationship(back_populates="report")  # type: ignore[name-defined]
    technician: Mapped["Employee"] = relationship()  # type: ignore[name-defined]
    attachments: Mapped[list["SatAttachment"]] = relationship(  # type: ignore[name-defined]
        primaryjoin="SatInterventionReport.id == foreign(SatAttachment.intervention_report_id)",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<SatInterventionReport(id={self.id}, status={self.report_status})>"
```

- [ ] **Step 10: Create `backend/app/modules/sat/models/attachment.py`**

```python
"""SAT attachment model."""

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.models.enums import AttachmentFileType, AttachmentSource


class SatAttachment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """SAT attachment - files linked to reports or assistances."""

    __tablename__ = "sat_attachments"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    intervention_report_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_intervention_reports.id", ondelete="CASCADE"),
        nullable=True,
    )
    assistance_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sat_assistances.id", ondelete="CASCADE"),
        nullable=True,
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[AttachmentFileType] = mapped_column(
        Enum(AttachmentFileType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    source: Mapped[AttachmentSource] = mapped_column(
        Enum(AttachmentSource, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AttachmentSource.WEB_UPLOAD,
    )
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<SatAttachment(id={self.id}, type={self.file_type})>"
```

- [ ] **Step 11: Add `is_sat_technician` to Employee model**

In `backend/app/shared/models/employee.py`, add after `is_backoffice`:

```python
    is_sat_technician: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
```

And add the `sat_specializations` relationship after the existing relationships:

```python
    sat_specializations: Mapped[list["SatSpecialization"]] = relationship(  # type: ignore[name-defined]
        secondary="sat_employee_specializations",
        lazy="noload",
    )
```

- [ ] **Step 12: Update Employee schemas to include `is_sat_technician`**

In `backend/app/shared/schemas/employee.py`, add to `EmployeeCreate`:

```python
    is_sat_technician: bool = False
```

Add to `EmployeeUpdate`:

```python
    is_sat_technician: bool | None = None
```

Add to `EmployeeResponse`:

```python
    is_sat_technician: bool = False
```

- [ ] **Step 14: Create `backend/app/modules/sat/models/__init__.py`**

```python
"""SAT module models."""

from app.modules.sat.models.attachment import SatAttachment
from app.modules.sat.models.assistance import SatAssistance
from app.modules.sat.models.contact import SatContact
from app.modules.sat.models.customer import SatCustomer
from app.modules.sat.models.employee_specialization import SatEmployeeSpecialization
from app.modules.sat.models.intervention_report import SatInterventionReport
from app.modules.sat.models.machine import SatMachine
from app.modules.sat.models.service_type import SatServiceType
from app.modules.sat.models.specialization import SatSpecialization

__all__ = [
    "SatAttachment",
    "SatAssistance",
    "SatContact",
    "SatCustomer",
    "SatEmployeeSpecialization",
    "SatInterventionReport",
    "SatMachine",
    "SatServiceType",
    "SatSpecialization",
]
```

- [ ] **Step 15: Add SAT models to `backend/app/models/__init__.py`**

Add imports:

```python
# SAT module models
from app.modules.sat.models.attachment import SatAttachment
from app.modules.sat.models.assistance import SatAssistance
from app.modules.sat.models.contact import SatContact
from app.modules.sat.models.customer import SatCustomer
from app.modules.sat.models.employee_specialization import SatEmployeeSpecialization
from app.modules.sat.models.intervention_report import SatInterventionReport
from app.modules.sat.models.machine import SatMachine
from app.modules.sat.models.service_type import SatServiceType
from app.modules.sat.models.specialization import SatSpecialization
```

And add to `__all__`:

```python
    # SAT
    "SatAttachment",
    "SatAssistance",
    "SatContact",
    "SatCustomer",
    "SatEmployeeSpecialization",
    "SatInterventionReport",
    "SatMachine",
    "SatServiceType",
    "SatSpecialization",
```

- [ ] **Step 16: Verify all models import cleanly**

Run: `cd backend && python -c "from app.modules.sat.models import *; print('OK')"`
Expected: `OK`

- [ ] **Step 17: Commit**

```bash
git add backend/app/modules/sat/ backend/app/shared/models/employee.py backend/app/models/__init__.py
git commit -m "feat(sat): add all SAT database models and employee extension"
```

---

## Task 3: Create SAT Pydantic schemas

**Files:**
- Create: `backend/app/modules/sat/schemas/service_type.py`
- Create: `backend/app/modules/sat/schemas/specialization.py`
- Create: `backend/app/modules/sat/schemas/customer.py`
- Create: `backend/app/modules/sat/schemas/contact.py`
- Create: `backend/app/modules/sat/schemas/machine.py`
- Create: `backend/app/modules/sat/schemas/assistance.py`
- Create: `backend/app/modules/sat/schemas/intervention_report.py`
- Create: `backend/app/modules/sat/schemas/attachment.py`
- Create: `backend/app/modules/sat/schemas/__init__.py`
- Modify: `backend/app/schemas/__init__.py`

- [ ] **Step 1: Create `backend/app/modules/sat/schemas/service_type.py`**

```python
"""SAT service type schemas."""

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatServiceTypeBase(BaseSchema):
    """Base service type schema."""

    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    is_active: bool = True


class SatServiceTypeCreate(SatServiceTypeBase):
    """Service type creation schema."""

    organization_id: str | None = None


class SatServiceTypeUpdate(BaseSchema):
    """Service type update schema."""

    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    is_active: bool | None = None


class SatServiceTypeResponse(SatServiceTypeBase, TimestampMixin, SoftDeleteMixin):
    """Service type response schema."""

    id: str
    organization_id: str
```

- [ ] **Step 2: Create `backend/app/modules/sat/schemas/specialization.py`**

```python
"""SAT specialization schemas."""

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatSpecializationBase(BaseSchema):
    """Base specialization schema."""

    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    is_active: bool = True


class SatSpecializationCreate(SatSpecializationBase):
    """Specialization creation schema."""

    organization_id: str | None = None


class SatSpecializationUpdate(BaseSchema):
    """Specialization update schema."""

    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    is_active: bool | None = None


class SatSpecializationResponse(SatSpecializationBase, TimestampMixin, SoftDeleteMixin):
    """Specialization response schema."""

    id: str
    organization_id: str
```

- [ ] **Step 3: Create `backend/app/modules/sat/schemas/customer.py`**

```python
"""SAT customer schemas."""

from datetime import datetime

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatCustomerBase(BaseSchema):
    """Base customer schema."""

    name: str = Field(..., min_length=1, max_length=255)
    tax_id: str | None = Field(None, max_length=50)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    notes: str | None = None


class SatCustomerCreate(SatCustomerBase):
    """Customer creation schema."""

    organization_id: str | None = None
    phc_id: str | None = Field(None, max_length=100)


class SatCustomerUpdate(BaseSchema):
    """Customer update schema."""

    name: str | None = Field(None, min_length=1, max_length=255)
    tax_id: str | None = Field(None, max_length=50)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    notes: str | None = None


class SatCustomerResponse(SatCustomerBase, TimestampMixin, SoftDeleteMixin):
    """Customer response schema."""

    id: str
    organization_id: str
    phc_id: str | None = None
    synced_at: datetime | None = None
```

- [ ] **Step 4: Create `backend/app/modules/sat/schemas/contact.py`**

```python
"""SAT contact schemas."""

from pydantic import Field

from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatContactBase(BaseSchema):
    """Base contact schema."""

    name: str = Field(..., min_length=1, max_length=200)
    role: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    is_whatsapp: bool = False


class SatContactCreate(SatContactBase):
    """Contact creation schema."""

    organization_id: str | None = None
    customer_id: str | None = None


class SatContactUpdate(BaseSchema):
    """Contact update schema."""

    name: str | None = Field(None, min_length=1, max_length=200)
    role: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    is_whatsapp: bool | None = None


class SatContactResponse(SatContactBase, TimestampMixin, SoftDeleteMixin):
    """Contact response schema."""

    id: str
    organization_id: str
    customer_id: str
```

- [ ] **Step 5: Create `backend/app/modules/sat/schemas/machine.py`**

```python
"""SAT machine schemas."""

from datetime import date

from pydantic import Field

from app.shared.models.enums import MachineType
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatMachineBase(BaseSchema):
    """Base machine schema."""

    customer_id: str
    brand: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    serial_number: str | None = Field(None, max_length=100)
    machine_type: MachineType
    installation_date: date | None = None
    location_notes: str | None = None
    notes: str | None = None


class SatMachineCreate(SatMachineBase):
    """Machine creation schema."""

    organization_id: str | None = None


class SatMachineUpdate(BaseSchema):
    """Machine update schema."""

    customer_id: str | None = None
    brand: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    serial_number: str | None = Field(None, max_length=100)
    machine_type: MachineType | None = None
    installation_date: date | None = None
    location_notes: str | None = None
    notes: str | None = None


class SatMachineResponse(SatMachineBase, TimestampMixin, SoftDeleteMixin):
    """Machine response schema."""

    id: str
    organization_id: str
```

- [ ] **Step 6: Create `backend/app/modules/sat/schemas/assistance.py`**

```python
"""SAT assistance schemas."""

from datetime import date, datetime, time

from pydantic import Field

from app.shared.models.enums import AssistancePriority, AssistanceStatus
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatAssistanceBase(BaseSchema):
    """Base assistance schema."""

    customer_id: str
    machine_id: str | None = None
    technician_id: str | None = None
    service_type_id: str
    priority: AssistancePriority = AssistancePriority.MEDIUM
    status: AssistanceStatus = AssistanceStatus.REQUESTED
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    problem_description: str | None = None


class SatAssistanceCreate(SatAssistanceBase):
    """Assistance creation schema."""

    organization_id: str | None = None
    phc_id: str | None = Field(None, max_length=100)


class SatAssistanceUpdate(BaseSchema):
    """Assistance update schema."""

    customer_id: str | None = None
    machine_id: str | None = None
    technician_id: str | None = None
    service_type_id: str | None = None
    priority: AssistancePriority | None = None
    status: AssistanceStatus | None = None
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    problem_description: str | None = None


class SatAssistanceStatusUpdate(BaseSchema):
    """Assistance status-only update schema."""

    status: AssistanceStatus


class SatAssistanceResponse(SatAssistanceBase, TimestampMixin, SoftDeleteMixin):
    """Assistance response schema."""

    id: str
    organization_id: str
    phc_id: str | None = None
    sla_response_deadline: datetime | None = None
    sla_resolution_deadline: datetime | None = None
```

- [ ] **Step 7: Create `backend/app/modules/sat/schemas/intervention_report.py`**

```python
"""SAT intervention report schemas."""

from datetime import datetime

from pydantic import Field

from app.shared.models.enums import ReportStatus
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatInterventionReportBase(BaseSchema):
    """Base intervention report schema."""

    assistance_id: str
    technician_id: str
    diagnosis: str | None = None
    actions_taken: str | None = None
    parts_replaced: list[str] | None = Field(default_factory=list)
    time_travel_minutes: int | None = Field(None, ge=0)
    time_onsite_minutes: int | None = Field(None, ge=0)
    next_steps: str | None = None
    report_status: ReportStatus = ReportStatus.DRAFT


class SatInterventionReportCreate(SatInterventionReportBase):
    """Intervention report creation schema."""

    organization_id: str | None = None


class SatInterventionReportUpdate(BaseSchema):
    """Intervention report update schema."""

    diagnosis: str | None = None
    actions_taken: str | None = None
    parts_replaced: list[str] | None = None
    time_travel_minutes: int | None = Field(None, ge=0)
    time_onsite_minutes: int | None = Field(None, ge=0)
    next_steps: str | None = None
    report_status: ReportStatus | None = None


class SatInterventionReportResponse(SatInterventionReportBase, TimestampMixin, SoftDeleteMixin):
    """Intervention report response schema."""

    id: str
    organization_id: str
    ai_raw_transcription: str | None = None
    ai_structured_draft: str | None = None
    customer_signature_url: str | None = None
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
```

- [ ] **Step 8: Create `backend/app/modules/sat/schemas/attachment.py`**

```python
"""SAT attachment schemas."""

from pydantic import Field

from app.shared.models.enums import AttachmentFileType, AttachmentSource
from app.shared.schemas.base import BaseSchema, SoftDeleteMixin, TimestampMixin


class SatAttachmentCreate(BaseSchema):
    """Attachment creation schema."""

    organization_id: str | None = None
    intervention_report_id: str | None = None
    assistance_id: str | None = None
    file_url: str = Field(..., max_length=500)
    file_type: AttachmentFileType
    source: AttachmentSource = AttachmentSource.WEB_UPLOAD
    caption: str | None = None


class SatAttachmentResponse(BaseSchema, TimestampMixin, SoftDeleteMixin):
    """Attachment response schema."""

    id: str
    organization_id: str
    intervention_report_id: str | None = None
    assistance_id: str | None = None
    file_url: str
    file_type: AttachmentFileType
    source: AttachmentSource
    caption: str | None = None
```

- [ ] **Step 9: Create `backend/app/modules/sat/schemas/__init__.py`**

```python
"""SAT module schemas."""

from app.modules.sat.schemas.assistance import (
    SatAssistanceCreate,
    SatAssistanceResponse,
    SatAssistanceStatusUpdate,
    SatAssistanceUpdate,
)
from app.modules.sat.schemas.attachment import SatAttachmentCreate, SatAttachmentResponse
from app.modules.sat.schemas.contact import (
    SatContactCreate,
    SatContactResponse,
    SatContactUpdate,
)
from app.modules.sat.schemas.customer import (
    SatCustomerCreate,
    SatCustomerResponse,
    SatCustomerUpdate,
)
from app.modules.sat.schemas.intervention_report import (
    SatInterventionReportCreate,
    SatInterventionReportResponse,
    SatInterventionReportUpdate,
)
from app.modules.sat.schemas.machine import (
    SatMachineCreate,
    SatMachineResponse,
    SatMachineUpdate,
)
from app.modules.sat.schemas.service_type import (
    SatServiceTypeCreate,
    SatServiceTypeResponse,
    SatServiceTypeUpdate,
)
from app.modules.sat.schemas.specialization import (
    SatSpecializationCreate,
    SatSpecializationResponse,
    SatSpecializationUpdate,
)

__all__ = [
    "SatAssistanceCreate",
    "SatAssistanceUpdate",
    "SatAssistanceStatusUpdate",
    "SatAssistanceResponse",
    "SatAttachmentCreate",
    "SatAttachmentResponse",
    "SatContactCreate",
    "SatContactUpdate",
    "SatContactResponse",
    "SatCustomerCreate",
    "SatCustomerUpdate",
    "SatCustomerResponse",
    "SatInterventionReportCreate",
    "SatInterventionReportUpdate",
    "SatInterventionReportResponse",
    "SatMachineCreate",
    "SatMachineUpdate",
    "SatMachineResponse",
    "SatServiceTypeCreate",
    "SatServiceTypeUpdate",
    "SatServiceTypeResponse",
    "SatSpecializationCreate",
    "SatSpecializationUpdate",
    "SatSpecializationResponse",
]
```

- [ ] **Step 10: Add SAT schema re-exports to `backend/app/schemas/__init__.py`**

Add import block:

```python
# SAT module schemas
from app.modules.sat.schemas import (  # noqa: F401
    SatAssistanceCreate,
    SatAssistanceUpdate,
    SatAssistanceStatusUpdate,
    SatAssistanceResponse,
    SatAttachmentCreate,
    SatAttachmentResponse,
    SatContactCreate,
    SatContactUpdate,
    SatContactResponse,
    SatCustomerCreate,
    SatCustomerUpdate,
    SatCustomerResponse,
    SatInterventionReportCreate,
    SatInterventionReportUpdate,
    SatInterventionReportResponse,
    SatMachineCreate,
    SatMachineUpdate,
    SatMachineResponse,
    SatServiceTypeCreate,
    SatServiceTypeUpdate,
    SatServiceTypeResponse,
    SatSpecializationCreate,
    SatSpecializationUpdate,
    SatSpecializationResponse,
)
```

And add all names to `__all__`.

- [ ] **Step 11: Verify schemas import cleanly**

Run: `cd backend && python -c "from app.modules.sat.schemas import *; print('OK')"`
Expected: `OK`

- [ ] **Step 12: Commit**

```bash
git add backend/app/modules/sat/schemas/ backend/app/schemas/__init__.py
git commit -m "feat(sat): add all SAT Pydantic schemas"
```

---

## Task 4: Create SAT services

**Files:**
- Create: `backend/app/modules/sat/services/service_type.py`
- Create: `backend/app/modules/sat/services/specialization.py`
- Create: `backend/app/modules/sat/services/customer.py`
- Create: `backend/app/modules/sat/services/contact.py`
- Create: `backend/app/modules/sat/services/machine.py`
- Create: `backend/app/modules/sat/services/assistance.py`
- Create: `backend/app/modules/sat/services/intervention_report.py`
- Create: `backend/app/modules/sat/services/attachment.py`
- Create: `backend/app/modules/sat/services/__init__.py`
- Modify: `backend/app/services/__init__.py`

- [ ] **Step 1: Create `backend/app/modules/sat/services/service_type.py`**

```python
"""SAT service type service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.modules.sat.models.service_type import SatServiceType
from app.modules.sat.schemas.service_type import SatServiceTypeCreate, SatServiceTypeUpdate
from app.shared.services.base import BaseService


class SatServiceTypeService(BaseService[SatServiceType, SatServiceTypeCreate, SatServiceTypeUpdate]):
    """Service type service with unique code validation."""

    def __init__(self):
        super().__init__(SatServiceType)

    def create(self, db: Session, *, obj_in: SatServiceTypeCreate) -> SatServiceType:
        """Create with unique code check per org."""
        existing = db.execute(
            select(SatServiceType).where(
                SatServiceType.code == obj_in.code,
                SatServiceType.organization_id == obj_in.organization_id,
                SatServiceType.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if existing:
            raise ConflictError(
                message="Service type with this code already exists",
                details={"code": obj_in.code},
            )
        return super().create(db, obj_in=obj_in)


sat_service_type_service = SatServiceTypeService()
```

- [ ] **Step 2: Create `backend/app/modules/sat/services/specialization.py`**

```python
"""SAT specialization service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.modules.sat.models.specialization import SatSpecialization
from app.modules.sat.schemas.specialization import SatSpecializationCreate, SatSpecializationUpdate
from app.shared.services.base import BaseService


class SatSpecializationService(BaseService[SatSpecialization, SatSpecializationCreate, SatSpecializationUpdate]):
    """Specialization service with unique code validation."""

    def __init__(self):
        super().__init__(SatSpecialization)

    def create(self, db: Session, *, obj_in: SatSpecializationCreate) -> SatSpecialization:
        """Create with unique code check per org."""
        existing = db.execute(
            select(SatSpecialization).where(
                SatSpecialization.code == obj_in.code,
                SatSpecialization.organization_id == obj_in.organization_id,
                SatSpecialization.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if existing:
            raise ConflictError(
                message="Specialization with this code already exists",
                details={"code": obj_in.code},
            )
        return super().create(db, obj_in=obj_in)


sat_specialization_service = SatSpecializationService()
```

- [ ] **Step 3: Create `backend/app/modules/sat/services/customer.py`**

```python
"""SAT customer service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sat.models.customer import SatCustomer
from app.modules.sat.schemas.customer import SatCustomerCreate, SatCustomerUpdate
from app.shared.services.base import BaseService


class SatCustomerService(BaseService[SatCustomer, SatCustomerCreate, SatCustomerUpdate]):
    """Customer service."""

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
        """Search customers by name or filter by city."""
        stmt = select(SatCustomer).where(
            SatCustomer.organization_id == organization_id,
            SatCustomer.deleted_at.is_(None),
        )
        if query:
            stmt = stmt.where(SatCustomer.name.ilike(f"%{query}%"))
        if city:
            stmt = stmt.where(SatCustomer.city.ilike(f"%{city}%"))
        stmt = stmt.offset(skip).limit(limit)
        return list(db.execute(stmt).scalars().all())


sat_customer_service = SatCustomerService()
```

- [ ] **Step 4: Create `backend/app/modules/sat/services/contact.py`**

```python
"""SAT contact service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sat.models.contact import SatContact
from app.modules.sat.schemas.contact import SatContactCreate, SatContactUpdate
from app.shared.services.base import BaseService


class SatContactService(BaseService[SatContact, SatContactCreate, SatContactUpdate]):
    """Contact service."""

    def __init__(self):
        super().__init__(SatContact)

    def get_by_customer(
        self,
        db: Session,
        customer_id: str,
    ) -> list[SatContact]:
        """Get all contacts for a customer."""
        result = db.execute(
            select(SatContact).where(
                SatContact.customer_id == customer_id,
                SatContact.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())


sat_contact_service = SatContactService()
```

- [ ] **Step 5: Create `backend/app/modules/sat/services/machine.py`**

```python
"""SAT machine service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sat.models.machine import SatMachine
from app.modules.sat.schemas.machine import SatMachineCreate, SatMachineUpdate
from app.shared.models.enums import MachineType
from app.shared.services.base import BaseService


class SatMachineService(BaseService[SatMachine, SatMachineCreate, SatMachineUpdate]):
    """Machine service."""

    def __init__(self):
        super().__init__(SatMachine)

    def get_by_customer(
        self,
        db: Session,
        customer_id: str,
    ) -> list[SatMachine]:
        """Get all machines for a customer."""
        result = db.execute(
            select(SatMachine).where(
                SatMachine.customer_id == customer_id,
                SatMachine.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    def search(
        self,
        db: Session,
        *,
        organization_id: str,
        customer_id: str | None = None,
        machine_type: MachineType | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SatMachine]:
        """Search machines with filters."""
        stmt = select(SatMachine).where(
            SatMachine.organization_id == organization_id,
            SatMachine.deleted_at.is_(None),
        )
        if customer_id:
            stmt = stmt.where(SatMachine.customer_id == customer_id)
        if machine_type:
            stmt = stmt.where(SatMachine.machine_type == machine_type)
        stmt = stmt.offset(skip).limit(limit)
        return list(db.execute(stmt).scalars().all())


sat_machine_service = SatMachineService()
```

- [ ] **Step 6: Create `backend/app/modules/sat/services/assistance.py`**

```python
"""SAT assistance service."""

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.sat.models.assistance import SatAssistance
from app.modules.sat.schemas.assistance import SatAssistanceCreate, SatAssistanceUpdate
from app.shared.models.enums import AssistancePriority, AssistanceStatus
from app.shared.services.base import BaseService


class SatAssistanceService(BaseService[SatAssistance, SatAssistanceCreate, SatAssistanceUpdate]):
    """Assistance service."""

    def __init__(self):
        super().__init__(SatAssistance)

    def get_detail(self, db: Session, id: str) -> SatAssistance | None:
        """Get assistance with eagerly loaded report and attachments."""
        result = db.execute(
            select(SatAssistance)
            .options(
                selectinload(SatAssistance.report),
                selectinload(SatAssistance.customer),
                selectinload(SatAssistance.machine),
                selectinload(SatAssistance.technician),
                selectinload(SatAssistance.service_type),
            )
            .where(SatAssistance.id == id)
        )
        return result.scalar_one_or_none()

    def search(
        self,
        db: Session,
        *,
        organization_id: str,
        status: AssistanceStatus | None = None,
        priority: AssistancePriority | None = None,
        customer_id: str | None = None,
        technician_id: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SatAssistance]:
        """Search assistances with filters."""
        stmt = select(SatAssistance).where(
            SatAssistance.organization_id == organization_id,
            SatAssistance.deleted_at.is_(None),
        )
        if status:
            stmt = stmt.where(SatAssistance.status == status)
        if priority:
            stmt = stmt.where(SatAssistance.priority == priority)
        if customer_id:
            stmt = stmt.where(SatAssistance.customer_id == customer_id)
        if technician_id:
            stmt = stmt.where(SatAssistance.technician_id == technician_id)
        stmt = stmt.order_by(SatAssistance.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)
        return list(db.execute(stmt).scalars().all())


sat_assistance_service = SatAssistanceService()
```

- [ ] **Step 7: Create `backend/app/modules/sat/services/intervention_report.py`**

```python
"""SAT intervention report service."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sat.models.intervention_report import SatInterventionReport
from app.modules.sat.schemas.intervention_report import (
    SatInterventionReportCreate,
    SatInterventionReportUpdate,
)
from app.shared.models.enums import ReportStatus
from app.shared.services.base import BaseService


class SatInterventionReportService(
    BaseService[SatInterventionReport, SatInterventionReportCreate, SatInterventionReportUpdate]
):
    """Intervention report service."""

    def __init__(self):
        super().__init__(SatInterventionReport)

    def get_by_assistance(self, db: Session, assistance_id: str) -> SatInterventionReport | None:
        """Get report for a specific assistance."""
        result = db.execute(
            select(SatInterventionReport).where(
                SatInterventionReport.assistance_id == assistance_id,
                SatInterventionReport.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    def search(
        self,
        db: Session,
        *,
        organization_id: str,
        report_status: ReportStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SatInterventionReport]:
        """Search reports with filters."""
        stmt = select(SatInterventionReport).where(
            SatInterventionReport.organization_id == organization_id,
            SatInterventionReport.deleted_at.is_(None),
        )
        if report_status:
            stmt = stmt.where(SatInterventionReport.report_status == report_status)
        stmt = stmt.order_by(SatInterventionReport.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)
        return list(db.execute(stmt).scalars().all())


sat_intervention_report_service = SatInterventionReportService()
```

- [ ] **Step 8: Create `backend/app/modules/sat/services/attachment.py`**

```python
"""SAT attachment service."""

from app.modules.sat.models.attachment import SatAttachment
from app.modules.sat.schemas.attachment import SatAttachmentCreate
from app.shared.schemas.base import BaseSchema
from app.shared.services.base import BaseService


class SatAttachmentService(BaseService[SatAttachment, SatAttachmentCreate, BaseSchema]):
    """Attachment service."""

    def __init__(self):
        super().__init__(SatAttachment)


sat_attachment_service = SatAttachmentService()
```

- [ ] **Step 9: Create `backend/app/modules/sat/services/__init__.py`**

```python
"""SAT module services."""

from app.modules.sat.services.assistance import sat_assistance_service
from app.modules.sat.services.attachment import sat_attachment_service
from app.modules.sat.services.contact import sat_contact_service
from app.modules.sat.services.customer import sat_customer_service
from app.modules.sat.services.intervention_report import sat_intervention_report_service
from app.modules.sat.services.machine import sat_machine_service
from app.modules.sat.services.service_type import sat_service_type_service
from app.modules.sat.services.specialization import sat_specialization_service

__all__ = [
    "sat_assistance_service",
    "sat_attachment_service",
    "sat_contact_service",
    "sat_customer_service",
    "sat_intervention_report_service",
    "sat_machine_service",
    "sat_service_type_service",
    "sat_specialization_service",
]
```

- [ ] **Step 10: Add SAT services to `backend/app/services/__init__.py`**

Add imports and `__all__` entries following existing pattern.

- [ ] **Step 11: Verify services import cleanly**

Run: `cd backend && python -c "from app.modules.sat.services import *; print('OK')"`
Expected: `OK`

- [ ] **Step 12: Commit**

```bash
git add backend/app/modules/sat/services/ backend/app/services/__init__.py
git commit -m "feat(sat): add all SAT service layer"
```

---

## Task 5: Create SAT API routes

**Files:**
- Create: `backend/app/modules/sat/api/customers.py`
- Create: `backend/app/modules/sat/api/contacts.py`
- Create: `backend/app/modules/sat/api/machines.py`
- Create: `backend/app/modules/sat/api/assistances.py`
- Create: `backend/app/modules/sat/api/reports.py`
- Create: `backend/app/modules/sat/api/attachments.py`
- Create: `backend/app/modules/sat/api/technicians.py`
- Create: `backend/app/modules/sat/api/service_types.py`
- Create: `backend/app/modules/sat/api/specializations.py`
- Create: `backend/app/modules/sat/api/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`

All API route files follow the same pattern as `backend/app/modules/fleet/api/vehicles.py`. Each route uses `DBDep`, `CurrentUserDep` for reads, and `SatManagerDep` for writes. The `organization_id` is always set from `current_user.organization_id`.

- [ ] **Step 1: Create `backend/app/modules/sat/api/customers.py`**

```python
"""SAT customer endpoints."""

from fastapi import APIRouter

from app.shared.api.deps import CurrentUserDep, DBDep, SatManagerDep
from app.modules.sat.schemas.customer import SatCustomerCreate, SatCustomerResponse, SatCustomerUpdate
from app.modules.sat.services.customer import sat_customer_service

router = APIRouter()


@router.get("", response_model=list[SatCustomerResponse])
def list_customers(
    db: DBDep,
    current_user: CurrentUserDep,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    city: str | None = None,
) -> list[SatCustomerResponse]:
    """List customers with optional search and city filter."""
    customers = sat_customer_service.search(
        db,
        organization_id=current_user.organization_id,
        query=search,
        city=city,
        skip=skip,
        limit=limit,
    )
    return [SatCustomerResponse.model_validate(c) for c in customers]


@router.post("", response_model=SatCustomerResponse, status_code=201)
def create_customer(
    customer_in: SatCustomerCreate,
    db: DBDep,
    current_user: SatManagerDep,
) -> SatCustomerResponse:
    """Create a new customer."""
    data = customer_in.model_copy(update={"organization_id": current_user.organization_id})
    customer = sat_customer_service.create(db, obj_in=data)
    return SatCustomerResponse.model_validate(customer)


@router.get("/{customer_id}", response_model=SatCustomerResponse)
def get_customer(
    customer_id: str,
    db: DBDep,
    current_user: CurrentUserDep,
) -> SatCustomerResponse:
    """Get a customer by ID."""
    customer = sat_customer_service.get_or_404(db, customer_id)
    return SatCustomerResponse.model_validate(customer)


@router.patch("/{customer_id}", response_model=SatCustomerResponse)
def update_customer(
    customer_id: str,
    customer_in: SatCustomerUpdate,
    db: DBDep,
    current_user: SatManagerDep,
) -> SatCustomerResponse:
    """Update a customer."""
    customer = sat_customer_service.get_or_404(db, customer_id)
    updated = sat_customer_service.update(db, db_obj=customer, obj_in=customer_in)
    return SatCustomerResponse.model_validate(updated)


@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: str,
    db: DBDep,
    current_user: SatManagerDep,
) -> None:
    """Soft-delete a customer."""
    sat_customer_service.delete(db, customer_id)
```

- [ ] **Step 2: Create remaining API route files**

Create `contacts.py`, `machines.py`, `assistances.py`, `reports.py`, `attachments.py`, `technicians.py`, `service_types.py`, `specializations.py` — all following the exact same pattern as `customers.py` above. Each file:
- Uses the corresponding service singleton
- Uses the corresponding schemas
- `GET /` uses `CurrentUserDep`, returns list
- `POST /` uses `SatManagerDep`, sets `organization_id` from token
- `GET /{id}` uses `CurrentUserDep`
- `PATCH /{id}` uses `SatManagerDep`
- `DELETE /{id}` uses `SatManagerDep`, returns 204

Special cases:
- `contacts.py`: `GET /customers/{customer_id}/contacts` and `POST /customers/{customer_id}/contacts`
- `assistances.py`: Extra `PATCH /{id}/status` endpoint using `SatAssistanceStatusUpdate`
- `technicians.py`: Only `GET /` and `GET /{id}`, queries employees with `is_sat_technician=True`
- `attachments.py`: Only `POST /` and `DELETE /{id}`

- [ ] **Step 3: Create `backend/app/modules/sat/api/__init__.py`**

```python
"""SAT module API routes."""

from fastapi import APIRouter

from app.modules.sat.api import (
    assistances,
    attachments,
    contacts,
    customers,
    machines,
    reports,
    service_types,
    specializations,
    technicians,
)

sat_router = APIRouter()

sat_router.include_router(customers.router, prefix="/sat/customers", tags=["SAT Customers"])
sat_router.include_router(contacts.router, prefix="/sat", tags=["SAT Contacts"])
sat_router.include_router(machines.router, prefix="/sat/machines", tags=["SAT Machines"])
sat_router.include_router(assistances.router, prefix="/sat/assistances", tags=["SAT Assistances"])
sat_router.include_router(reports.router, prefix="/sat/reports", tags=["SAT Reports"])
sat_router.include_router(attachments.router, prefix="/sat/attachments", tags=["SAT Attachments"])
sat_router.include_router(technicians.router, prefix="/sat/technicians", tags=["SAT Technicians"])
sat_router.include_router(service_types.router, prefix="/sat/service-types", tags=["SAT Service Types"])
sat_router.include_router(specializations.router, prefix="/sat/specializations", tags=["SAT Specializations"])
```

- [ ] **Step 4: Register SAT router in `backend/app/api/v1/__init__.py`**

Add:

```python
from app.modules.sat.api import sat_router

# Include SAT module routes
api_router.include_router(sat_router)
```

- [ ] **Step 5: Verify the app starts**

Run: `cd backend && python -c "from app.main import app; print('Routes:', len(app.routes))"`
Expected: Prints route count without errors.

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/sat/api/ backend/app/api/v1/__init__.py
git commit -m "feat(sat): add all SAT API routes and register router"
```

---

## Task 6: Create Alembic migration and run it

**Files:**
- Create: `backend/alembic/versions/20260410_000000_XXXX_add_sat_module.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Generate Alembic migration**

Run: `cd backend && uv run alembic revision --autogenerate -m "add_sat_module"`

- [ ] **Step 2: Review generated migration**

Read the generated file. Ensure it:
- Creates all 9 `sat_*` tables
- Adds `is_sat_technician` to `employees`
- Adds `sat_manager` to the `userrole` enum type
- Creates the composite PK on `sat_employee_specializations`

If the `userrole` enum alteration is missing from autogenerate (common with Alembic), manually add:

```python
op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'sat_manager'")
```

- [ ] **Step 3: Run the migration**

Run: `cd backend && uv run alembic upgrade head`
Expected: Migration completes without errors.

- [ ] **Step 4: Add seed data for reference tables**

Add a data migration step at the end of `upgrade()` in the migration file:

```python
    # Seed default service types and specializations
    # These will be org-scoped, so they're seeded per first use or via a setup command
    pass  # Seeding deferred to application startup or admin UI
```

Note: Since reference data is org-scoped, seeding is best done via the admin UI or a management command, not in migrations.

- [ ] **Step 5: Add `sat_manager` test fixture to `backend/tests/conftest.py`**

Add after `test_fleet_manager` fixture:

```python
@pytest.fixture()
def test_sat_manager(
    db_session: Session, test_organization: Organization
) -> User:
    """Create test SAT manager user."""
    user = User(
        id=str(uuid4()),
        organization_id=test_organization.id,
        email="satmanager@test.com",
        password_hash=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="SatManager",
        role=UserRole.SAT_MANAGER,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.refresh(user)
    return user


@pytest.fixture()
def sat_manager_token(test_sat_manager: User) -> str:
    """Create SAT manager access token."""
    return create_access_token(
        subject=test_sat_manager.id,
        organization_id=test_sat_manager.organization_id,
        role=test_sat_manager.role.value,
    )


@pytest.fixture()
def sat_manager_headers(sat_manager_token: str) -> dict[str, str]:
    """Create headers with SAT manager token."""
    return {"Authorization": f"Bearer {sat_manager_token}"}
```

- [ ] **Step 6: Commit**

```bash
git add backend/alembic/versions/ backend/tests/conftest.py
git commit -m "feat(sat): add Alembic migration for SAT tables and test fixtures"
```

---

## Task 7: Write backend smoke tests

**Files:**
- Create: `backend/tests/smoke/test_sat_customers.py`
- Create: `backend/tests/smoke/test_sat_machines.py`
- Create: `backend/tests/smoke/test_sat_assistances.py`
- Create: `backend/tests/smoke/test_sat_reports.py`
- Create: `backend/tests/smoke/test_sat_contacts.py`
- Create: `backend/tests/smoke/test_sat_service_types.py`
- Create: `backend/tests/smoke/test_sat_specializations.py`

Each test file follows the pattern from `backend/tests/smoke/test_employees.py`. Tests verify HTTP status codes, not full business logic.

- [ ] **Step 1: Create `backend/tests/smoke/test_sat_customers.py`**

```python
"""Smoke tests for SAT customer endpoints."""

from fastapi.testclient import TestClient


class TestSatCustomerSmoke:
    """Verify SAT customer endpoints return expected status codes."""

    def test_list_customers_unauthorized(self, client: TestClient):
        """Unauthenticated request returns 401/403."""
        res = client.get("/api/v1/sat/customers")
        assert res.status_code in (401, 403)

    def test_list_customers(self, client: TestClient, admin_headers: dict):
        """Authenticated user can list customers."""
        res = client.get("/api/v1/sat/customers", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_customer_missing_fields_returns_422(
        self, client: TestClient, admin_headers: dict
    ):
        """POST /sat/customers with empty body returns 422."""
        res = client.post("/api/v1/sat/customers", json={}, headers=admin_headers)
        assert res.status_code == 422

    def test_create_and_get_customer(self, client: TestClient, admin_headers: dict):
        """Create a customer and retrieve it."""
        payload = {"name": "Test Customer", "city": "Lisbon"}
        res = client.post("/api/v1/sat/customers", json=payload, headers=admin_headers)
        assert res.status_code == 201
        customer_id = res.json()["id"]

        res = client.get(f"/api/v1/sat/customers/{customer_id}", headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["name"] == "Test Customer"

    def test_get_customer_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        """GET /sat/customers/{id} with nonexistent id returns 404."""
        res = client.get(
            "/api/v1/sat/customers/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_update_customer(self, client: TestClient, admin_headers: dict):
        """PATCH /sat/customers/{id} updates the customer."""
        payload = {"name": "Original"}
        res = client.post("/api/v1/sat/customers", json=payload, headers=admin_headers)
        customer_id = res.json()["id"]

        res = client.patch(
            f"/api/v1/sat/customers/{customer_id}",
            json={"name": "Updated"},
            headers=admin_headers,
        )
        assert res.status_code == 200
        assert res.json()["name"] == "Updated"

    def test_delete_customer(self, client: TestClient, admin_headers: dict):
        """DELETE /sat/customers/{id} returns 204."""
        payload = {"name": "To Delete"}
        res = client.post("/api/v1/sat/customers", json=payload, headers=admin_headers)
        customer_id = res.json()["id"]

        res = client.delete(f"/api/v1/sat/customers/{customer_id}", headers=admin_headers)
        assert res.status_code == 204
```

- [ ] **Step 2: Create remaining smoke test files**

Create `test_sat_machines.py`, `test_sat_assistances.py`, `test_sat_reports.py`, `test_sat_contacts.py`, `test_sat_service_types.py`, `test_sat_specializations.py` following the same pattern. Each tests:
- Unauthorized returns 401/403
- Authenticated list returns 200
- Empty body create returns 422
- Create + get round-trip
- Nonexistent get returns 404
- Update works
- Delete returns 204

Special considerations:
- **Machines**: Create requires a customer to exist first (create customer in test, use its ID)
- **Assistances**: Create requires customer + service_type to exist first
- **Reports**: Create requires assistance + employee (technician) to exist first
- **Contacts**: Uses nested route `/sat/customers/{id}/contacts`
- **Service Types/Specializations**: Standard CRUD, test unique code conflict (409)

- [ ] **Step 3: Run all smoke tests**

Run: `cd backend && uv run pytest tests/smoke/test_sat_*.py -v`
Expected: All tests pass.

- [ ] **Step 4: Run full smoke test suite to verify no regressions**

Run: `cd backend && uv run pytest tests/smoke/ -v`
Expected: All existing + new tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/smoke/test_sat_*.py
git commit -m "test(sat): add smoke tests for all SAT endpoints"
```

---

## Task 8: Add frontend TypeScript types and i18n keys

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/i18n/locales/en.json`
- Modify: `frontend/src/lib/i18n/locales/pt.json`

- [ ] **Step 1: Add SAT type definitions to `frontend/src/types/index.ts`**

Add after the Tool Management section:

```typescript
// =============================================================================
// SAT (SERVICE & ASSISTANCE TRACKING)
// =============================================================================

export type AssistanceStatus = "requested" | "scheduled" | "en_route" | "on_site" | "completed" | "reviewed" | "cancelled";
export type AssistancePriority = "low" | "medium" | "high" | "critical";
export type MachineType = "cnc" | "software";
export type ReportStatus = "draft" | "submitted" | "approved";
export type AttachmentFileType = "photo" | "audio" | "document";
export type AttachmentSource = "whatsapp" | "web_upload";

export interface SatCustomer extends BaseEntity {
  organizationId: string;
  phcId?: string;
  name: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  notes?: string;
  syncedAt?: string;
}

export interface SatContact extends BaseEntity {
  organizationId: string;
  customerId: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  isWhatsapp: boolean;
}

export interface SatMachine extends BaseEntity {
  organizationId: string;
  customerId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  machineType: MachineType;
  installationDate?: string;
  locationNotes?: string;
  notes?: string;
}

export interface SatAssistance extends BaseEntity {
  organizationId: string;
  phcId?: string;
  customerId: string;
  machineId?: string;
  technicianId?: string;
  serviceTypeId: string;
  priority: AssistancePriority;
  status: AssistanceStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  problemDescription?: string;
  slaResponseDeadline?: string;
  slaResolutionDeadline?: string;
}

export interface SatInterventionReport extends BaseEntity {
  organizationId: string;
  assistanceId: string;
  technicianId: string;
  diagnosis?: string;
  actionsTaken?: string;
  partsReplaced?: string[];
  timeTravelMinutes?: number;
  timeOnsiteMinutes?: number;
  nextSteps?: string;
  aiRawTranscription?: string;
  aiStructuredDraft?: string;
  customerSignatureUrl?: string;
  reportStatus: ReportStatus;
  submittedAt?: string;
  approvedAt?: string;
}

export interface SatAttachment extends BaseEntity {
  organizationId: string;
  interventionReportId?: string;
  assistanceId?: string;
  fileUrl: string;
  fileType: AttachmentFileType;
  source: AttachmentSource;
  caption?: string;
}

export interface SatServiceType extends BaseEntity {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface SatSpecialization extends BaseEntity {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}
```

- [ ] **Step 2: Add `sat_manager` to UserRole type**

Update the existing line:

```typescript
export type UserRole = "admin" | "fleet_manager" | "operator" | "viewer" | "technician" | "sat_manager";
```

- [ ] **Step 3: Add SAT i18n keys to `en.json`**

Add a `sat` section with keys for navigation, entities, statuses, priorities, form labels, and empty states. Also add `navigation.sat.*` keys.

- [ ] **Step 4: Add SAT i18n keys to `pt.json`**

Mirror the `en.json` structure with Portuguese translations.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/i18n/locales/
git commit -m "feat(sat): add frontend TypeScript types and i18n keys"
```

---

## Task 9: Create frontend API services and transformers

**Files:**
- Create: `frontend/src/lib/api/sat-customers.ts`
- Create: `frontend/src/lib/api/sat-machines.ts`
- Create: `frontend/src/lib/api/sat-assistances.ts`
- Create: `frontend/src/lib/api/sat-reports.ts`
- Create: `frontend/src/lib/api/sat-contacts.ts`
- Create: `frontend/src/lib/api/sat-attachments.ts`
- Create: `frontend/src/lib/api/sat-service-types.ts`
- Create: `frontend/src/lib/api/sat-specializations.ts`
- Create: `frontend/src/lib/api/sat-technicians.ts`
- Modify: `frontend/src/lib/api/transformers.ts`
- Modify: `frontend/src/lib/api/index.ts`

Each service file follows the pattern from `frontend/src/lib/api/vehicles.ts` — a singleton object with `getAll()`, `getById()`, `create()`, `update()`, `delete()` methods. Snake_case API responses are transformed to camelCase using transformer functions.

- [ ] **Step 1: Add SAT transformer functions to `frontend/src/lib/api/transformers.ts`**

Add transform functions for each SAT entity (customer, machine, assistance, report, contact, attachment, serviceType, specialization). Pattern:

```typescript
export function transformSatCustomer(data: Record<string, unknown>): SatCustomer {
  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    organizationId: data.organization_id as string,
    phcId: data.phc_id as string | undefined,
    name: data.name as string,
    taxId: data.tax_id as string | undefined,
    address: data.address as string | undefined,
    city: data.city as string | undefined,
    postalCode: data.postal_code as string | undefined,
    phone: data.phone as string | undefined,
    email: data.email as string | undefined,
    notes: data.notes as string | undefined,
    syncedAt: data.synced_at as string | undefined,
  };
}

export function transformSatCustomers(data: Record<string, unknown>[]): SatCustomer[] {
  return data.map(transformSatCustomer);
}
```

Repeat for all SAT entities.

- [ ] **Step 2: Create all SAT API service files**

Each follows this pattern (example: `sat-customers.ts`):

```typescript
import { apiClient } from "./client";
import { transformSatCustomer, transformSatCustomers, toSnakeCase } from "./transformers";
import type { SatCustomer } from "@/types";
import type { ListParams } from "./types";

export interface SatCustomerListParams extends ListParams {
  search?: string;
  city?: string;
}

export const satCustomersService = {
  async getAll(params?: SatCustomerListParams): Promise<SatCustomer[]> {
    const response = await apiClient.get<Record<string, unknown>[]>("/sat/customers", { params });
    return transformSatCustomers(response);
  },
  async getById(id: string): Promise<SatCustomer> {
    const response = await apiClient.get<Record<string, unknown>>(`/sat/customers/${id}`);
    return transformSatCustomer(response);
  },
  async create(data: Partial<SatCustomer>): Promise<SatCustomer> {
    const request = toSnakeCase(data);
    return transformSatCustomer(await apiClient.post<Record<string, unknown>>("/sat/customers", request));
  },
  async update(id: string, data: Partial<SatCustomer>): Promise<SatCustomer> {
    const request = toSnakeCase(data);
    return transformSatCustomer(await apiClient.patch<Record<string, unknown>>(`/sat/customers/${id}`, request));
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sat/customers/${id}`);
  },
};
```

Create similar files for: `sat-machines.ts`, `sat-assistances.ts`, `sat-reports.ts`, `sat-contacts.ts`, `sat-attachments.ts`, `sat-service-types.ts`, `sat-specializations.ts`, `sat-technicians.ts`.

- [ ] **Step 3: Export all SAT services from `frontend/src/lib/api/index.ts`**

Add:

```typescript
export { satCustomersService } from "./sat-customers";
export { satMachinesService } from "./sat-machines";
export { satAssistancesService } from "./sat-assistances";
export { satReportsService } from "./sat-reports";
export { satContactsService } from "./sat-contacts";
export { satAttachmentsService } from "./sat-attachments";
export { satServiceTypesService } from "./sat-service-types";
export { satSpecializationsService } from "./sat-specializations";
export { satTechniciansService } from "./sat-technicians";
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api/
git commit -m "feat(sat): add frontend API services and transformers"
```

---

## Task 10: Add SAT navigation and app-shell integration

**Files:**
- Modify: `frontend/src/data/mock-data.ts`
- Modify: `frontend/src/components/layout/app-shell.tsx`
- Modify: `frontend/src/components/layout/sidebar.tsx` (add Headset icon)

- [ ] **Step 1: Add `satNavigation` to `frontend/src/data/mock-data.ts`**

Add before `export const mockNavigation`:

```typescript
export const satNavigation: NavItem[] = [
  { id: "nav-sat-dashboard", label: "navigation.sat.dashboard", icon: "LayoutDashboard", url: "/sat", roles: ["admin", "sat_manager", "technician", "viewer"] },
  { id: "nav-sat-assistances", label: "navigation.sat.assistances", icon: "ClipboardList", url: "/sat/assistances", roles: ["admin", "sat_manager", "technician", "viewer"] },
  { id: "nav-sat-customers", label: "navigation.sat.customers", icon: "Building2", url: "/sat/customers", roles: ["admin", "sat_manager", "viewer"] },
  { id: "nav-sat-machines", label: "navigation.sat.machines", icon: "Puzzle", url: "/sat/machines", roles: ["admin", "sat_manager", "viewer"] },
  { id: "nav-sat-reports", label: "navigation.sat.reports", icon: "FileText", url: "/sat/reports", roles: ["admin", "sat_manager", "technician", "viewer"] },
  { id: "nav-sat-technicians", label: "navigation.sat.technicians", icon: "HardHat", url: "/sat/technicians", roles: ["admin", "sat_manager", "viewer"] },
  {
    id: "nav-sat-settings",
    label: "navigation.settings.title",
    icon: "Settings",
    url: "/sat/settings",
    roles: ["admin", "sat_manager"],
    children: [
      { id: "nav-sat-service-types", label: "navigation.sat.serviceTypes", icon: "List", url: "/sat/settings/service-types", roles: ["admin", "sat_manager"] },
      { id: "nav-sat-specializations", label: "navigation.sat.specializations", icon: "Layers", url: "/sat/settings/specializations", roles: ["admin", "sat_manager"] },
    ],
  },
];
```

- [ ] **Step 2: Update `app-shell.tsx` to detect SAT module**

In `frontend/src/components/layout/app-shell.tsx`:

1. Add import: `import { fleetNavigation, toolsNavigation, adminNavigation, satNavigation } from '@/data/mock-data';`
2. Add import: `import { Headset } from 'lucide-react';`
3. Add detection: `const isSatModule = pathname.startsWith('/sat');`
4. Update navigation selection:

```typescript
const moduleNavigation = React.useMemo(() => {
  if (isSatModule) return satNavigation;
  if (isToolsModule) return toolsNavigation;
  if (isAdminModule) return adminNavigation;
  return fleetNavigation;
}, [isSatModule, isToolsModule, isAdminModule]);
const moduleName = isSatModule ? 'SAT Manager' : isToolsModule ? 'Tool Manager' : isAdminModule ? 'Administration' : 'Fleet Manager';
const moduleIcon = isSatModule ? Headset : isToolsModule ? Wrench : isAdminModule ? ShieldCheck : Truck;
```

- [ ] **Step 3: Add `Headset` to sidebar icon map**

In `frontend/src/components/layout/sidebar.tsx`, add `Headset` to the import and `iconMap`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/data/mock-data.ts frontend/src/components/layout/app-shell.tsx frontend/src/components/layout/sidebar.tsx
git commit -m "feat(sat): add SAT navigation and app-shell module detection"
```

---

## Task 11: Create SAT frontend pages — Dashboard, Customers, Machines

**Files:**
- Create: `frontend/src/app/(dashboard)/sat/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/loading.tsx`
- Create: `frontend/src/app/(dashboard)/sat/error.tsx`
- Create: `frontend/src/app/(dashboard)/sat/customers/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/customers/new/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/customers/[id]/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/customers/[id]/edit/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/machines/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/machines/new/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/machines/[id]/page.tsx`
- Create: `frontend/src/app/(dashboard)/sat/machines/[id]/edit/page.tsx`

All pages follow patterns from `frontend/src/app/(dashboard)/fleet/vehicles/`.

- [ ] **Step 1: Create SAT dashboard placeholder**

`sat/page.tsx` — Simple card layout with placeholder KPI cards (total customers, open assistances, pending reports). Uses `useTranslation()`, calls `satCustomersService.getAll()` and `satAssistancesService.getAll()` to show counts.

- [ ] **Step 2: Create `loading.tsx` and `error.tsx`**

Copy pattern from any existing module's loading/error pages.

- [ ] **Step 3: Create Customer list, new, detail, edit pages**

Follow the `vehicles` pattern:
- List: table with search, city filter, delete dialog
- New: form with name (required), tax_id, address, city, postal_code, phone, email, notes
- Detail: customer info + tabs for contacts (inline CRUD with dialogs), machines, assistance history
- Edit: pre-filled form

- [ ] **Step 4: Create Machine list, new, detail, edit pages**

- List: table with customer filter, machine_type filter
- New: form with customer selector, brand, model, serial_number, machine_type, installation_date, notes
- Detail: machine info + linked assistances
- Edit: pre-filled form

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/\(dashboard\)/sat/
git commit -m "feat(sat): add dashboard, customer, and machine frontend pages"
```

---

## Task 12: Create SAT frontend pages — Assistances, Reports, Technicians, Settings

**Files:**
- Create: Assistance list, new, detail, edit pages
- Create: Report list, new, detail, edit pages
- Create: Technician list and detail pages
- Create: Service Types list, new, edit pages
- Create: Specializations list, new, edit pages

- [ ] **Step 1: Create Assistance pages**

- List: table with status, priority, customer, technician filters. Status badge with color coding.
- New: form with customer selector (loads machines for selected customer), technician selector, service type selector, priority, scheduled date/time, problem description
- Detail: status action buttons ("Mark En Route", "Mark On Site", etc.), customer/machine/technician info cards, linked report card (or "Create Report" button), attachments section
- Edit: pre-filled form

- [ ] **Step 2: Create Report pages**

- List: table with report_status filter
- New: form with assistance selector, technician selector, diagnosis, actions_taken, parts_replaced (dynamic list), time fields, next_steps
- Detail: full report view with all fields
- Edit: pre-filled form

- [ ] **Step 3: Create Technician pages (read-only)**

- List: shows employees where `is_sat_technician=true`, displays specializations as badges
- Detail: employee profile + specializations + their assigned assistances

- [ ] **Step 4: Create Settings pages (Service Types + Specializations)**

Simple CRUD for both — list with name/code/active status, new form, edit form. Follow reference table pattern.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/\(dashboard\)/sat/
git commit -m "feat(sat): add assistance, report, technician, and settings frontend pages"
```

---

## Task 13: Final verification

- [ ] **Step 1: Run backend smoke tests**

Run: `cd backend && uv run pytest tests/smoke/ -v`
Expected: All tests pass, including new SAT tests.

- [ ] **Step 2: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual smoke test**

Start backend and frontend, navigate to `/sat`, verify:
- Dashboard loads
- Customer CRUD works (create, view, edit, delete)
- Machine CRUD works
- Assistance CRUD works with customer/service type selectors
- Report CRUD works
- Technician list shows (may be empty if no employees flagged)
- Settings pages for service types and specializations work
- Navigation sidebar shows all SAT links
- i18n keys render (no raw key strings visible)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(sat): complete SAT module core data and CRUD"
```
