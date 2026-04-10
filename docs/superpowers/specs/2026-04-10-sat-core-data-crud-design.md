# SAT Module — Core Data & CRUD Design

**Date:** 2026-04-10
**Status:** Draft
**Scope:** Sub-project 1 of 6 — Core entities, API, and frontend CRUD pages
**Depends on:** Existing Employee model, auth system, shared BaseService

---

## 1. Overview

The SAT (Service & Assistance Tracking) module adds field service management to DNC Hub. This first sub-project builds the foundational data layer: customers, machines, assistances, intervention reports, and supporting reference tables — with full CRUD in both backend and frontend.

Future sub-projects (out of scope here):
- PHC SQL Server sync
- WhatsApp integration (WAHA)
- AI processing (audio transcription, report structuring)
- SLA tracking & analytics dashboard
- Customer digital signatures

## 2. Employee Table Extension

Two changes to the existing `employees` table (via Alembic migration):

| Column | Type | Default | Purpose |
|---|---|---|---|
| `is_sat_technician` | `boolean NOT NULL` | `false` | Flags employees who do SAT field work (mirrors `is_backoffice` pattern) |

The `sat_specializations` ARRAY column is **not** added. Instead, specializations are managed via a many-to-many junction table (`sat_employee_specializations`) linking to the `sat_specializations` reference table. This keeps specializations as user-manageable data, not hardcoded values.

### Impact on existing code

- Employee model: add `is_sat_technician` column + relationship to `sat_employee_specializations`
- Employee schemas: add `is_sat_technician` field (boolean) + `sat_specializations` (list, read-only, populated from junction)
- Employee service: no changes needed (field is just a boolean)
- Fleet frontend: no changes needed (`is_sat_technician` is not displayed in Fleet pages)

## 3. Database Schema

### 3.1 Reference Tables

**`sat_specializations`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `name` | VARCHAR(100) | NOT NULL |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE per org |
| `description` | TEXT | nullable |
| `is_active` | BOOLEAN | NOT NULL, default `true` |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

Seeded with: `cnc_mechanical`, `cnc_electrical`, `cimco_software`, `phc_software`

**`sat_service_types`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `name` | VARCHAR(100) | NOT NULL |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE per org |
| `description` | TEXT | nullable |
| `is_active` | BOOLEAN | NOT NULL, default `true` |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

Seeded with: `cnc_mechanical`, `cnc_electrical`, `cimco_software`, `phc_software`, `other`

### 3.2 Junction Table

**`sat_employee_specializations`**

| Column | Type | Constraints |
|---|---|---|
| `employee_id` | UUID | FK → employees (CASCADE), PK |
| `specialization_id` | UUID | FK → sat_specializations (CASCADE), PK |

Composite primary key on (`employee_id`, `specialization_id`).

### 3.3 Domain Tables

**`sat_customers`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `phc_id` | VARCHAR(100) | nullable, UNIQUE per org |
| `name` | VARCHAR(255) | NOT NULL |
| `tax_id` | VARCHAR(50) | nullable |
| `address` | TEXT | nullable |
| `city` | VARCHAR(100) | nullable |
| `postal_code` | VARCHAR(20) | nullable |
| `phone` | VARCHAR(50) | nullable |
| `email` | VARCHAR(255) | nullable |
| `notes` | TEXT | nullable |
| `synced_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

**`sat_contacts`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `customer_id` | UUID | FK → sat_customers (CASCADE), NOT NULL |
| `name` | VARCHAR(200) | NOT NULL |
| `role` | VARCHAR(100) | nullable |
| `phone` | VARCHAR(50) | nullable |
| `email` | VARCHAR(255) | nullable |
| `is_whatsapp` | BOOLEAN | NOT NULL, default `false` |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

**`sat_machines`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `customer_id` | UUID | FK → sat_customers (RESTRICT), NOT NULL |
| `brand` | VARCHAR(100) | nullable |
| `model` | VARCHAR(100) | nullable |
| `serial_number` | VARCHAR(100) | nullable |
| `machine_type` | ENUM(`cnc`, `software`) | NOT NULL |
| `installation_date` | DATE | nullable |
| `location_notes` | TEXT | nullable |
| `notes` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

**`sat_assistances`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `phc_id` | VARCHAR(100) | nullable, UNIQUE per org |
| `customer_id` | UUID | FK → sat_customers (RESTRICT), NOT NULL |
| `machine_id` | UUID | FK → sat_machines (SET NULL), nullable |
| `technician_id` | UUID | FK → employees (SET NULL), nullable |
| `service_type_id` | UUID | FK → sat_service_types (RESTRICT), NOT NULL |
| `priority` | ENUM | NOT NULL, default `medium` |
| `status` | ENUM | NOT NULL, default `requested` |
| `scheduled_date` | DATE | nullable |
| `scheduled_time` | TIME | nullable |
| `problem_description` | TEXT | nullable |
| `sla_response_deadline` | TIMESTAMPTZ | nullable |
| `sla_resolution_deadline` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

Enum values for `priority`: `low`, `medium`, `high`, `critical`
Enum values for `status`: `requested`, `scheduled`, `en_route`, `on_site`, `completed`, `reviewed`, `cancelled`

**`sat_intervention_reports`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `assistance_id` | UUID | FK → sat_assistances (CASCADE), NOT NULL |
| `technician_id` | UUID | FK → employees (RESTRICT), NOT NULL |
| `diagnosis` | TEXT | nullable |
| `actions_taken` | TEXT | nullable |
| `parts_replaced` | JSON | nullable, default `[]` |
| `time_travel_minutes` | INTEGER | nullable |
| `time_onsite_minutes` | INTEGER | nullable |
| `next_steps` | TEXT | nullable |
| `ai_raw_transcription` | TEXT | nullable |
| `ai_structured_draft` | TEXT | nullable |
| `customer_signature_url` | VARCHAR(500) | nullable |
| `report_status` | ENUM | NOT NULL, default `draft` |
| `submitted_at` | TIMESTAMPTZ | nullable |
| `approved_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

Enum values for `report_status`: `draft`, `submitted`, `approved`

**`sat_attachments`**

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `organization_id` | UUID | FK → organizations (RESTRICT), NOT NULL |
| `intervention_report_id` | UUID | FK → sat_intervention_reports (CASCADE), nullable |
| `assistance_id` | UUID | FK → sat_assistances (CASCADE), nullable |
| `file_url` | VARCHAR(500) | NOT NULL |
| `file_type` | ENUM(`photo`, `audio`, `document`) | NOT NULL |
| `source` | ENUM(`whatsapp`, `web_upload`) | NOT NULL, default `web_upload` |
| `caption` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | server default now() |
| `updated_at` | TIMESTAMPTZ | server default now(), on update |
| `deleted_at` | TIMESTAMPTZ | nullable |

CHECK constraint: at least one of `intervention_report_id` or `assistance_id` must be non-null.

## 4. Backend Structure

### 4.1 Module Directory

```
backend/app/modules/sat/
├── __init__.py
├── api/
│   ├── __init__.py              # sat_router aggregation
│   ├── customers.py             # Customer CRUD endpoints
│   ├── contacts.py              # Contact endpoints (nested under customer)
│   ├── machines.py              # Machine CRUD endpoints
│   ├── assistances.py           # Assistance CRUD + status update
│   ├── reports.py               # InterventionReport CRUD
│   ├── attachments.py           # Attachment upload/delete
│   ├── technicians.py           # Read-only technician list
│   ├── service_types.py         # ServiceType CRUD
│   └── specializations.py       # Specialization CRUD
├── models/
│   ├── __init__.py
│   ├── customer.py
│   ├── contact.py
│   ├── machine.py
│   ├── assistance.py
│   ├── intervention_report.py
│   ├── attachment.py
│   ├── service_type.py
│   ├── specialization.py
│   └── employee_specialization.py  # Junction table
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

### 4.2 New Enums (in `shared/models/enums.py`)

```python
class AssistanceStatus(str, Enum):
    REQUESTED = "requested"
    SCHEDULED = "scheduled"
    EN_ROUTE = "en_route"
    ON_SITE = "on_site"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    CANCELLED = "cancelled"

class AssistancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MachineType(str, Enum):
    CNC = "cnc"
    SOFTWARE = "software"

class ReportStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"

class AttachmentFileType(str, Enum):
    PHOTO = "photo"
    AUDIO = "audio"
    DOCUMENT = "document"

class AttachmentSource(str, Enum):
    WHATSAPP = "whatsapp"
    WEB_UPLOAD = "web_upload"
```

### 4.3 New UserRole

Add `SAT_MANAGER = "sat_manager"` to the existing `UserRole` enum.

### 4.4 New Auth Dependency

`SatManagerDep` in `shared/api/deps.py` — allows `admin` and `sat_manager` roles for write operations.

### 4.5 Router Registration

In `api/v1/__init__.py`:
```python
from app.modules.sat.api import sat_router
api_router.include_router(sat_router)
```

### 4.6 API Endpoints

**Customers** — prefix `/sat/customers`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List (search by name, filter by city, pagination) |
| POST | `/` | SatManagerDep | Create customer |
| GET | `/{id}` | Any authenticated | Get detail |
| PATCH | `/{id}` | SatManagerDep | Update |
| DELETE | `/{id}` | SatManagerDep | Soft-delete |

**Contacts** — prefix `/sat`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/customers/{customer_id}/contacts` | Any authenticated | List contacts for customer |
| POST | `/customers/{customer_id}/contacts` | SatManagerDep | Create contact |
| PATCH | `/contacts/{id}` | SatManagerDep | Update contact |
| DELETE | `/contacts/{id}` | SatManagerDep | Delete contact |

**Machines** — prefix `/sat/machines`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List (filter by customer_id, machine_type) |
| POST | `/` | SatManagerDep | Create |
| GET | `/{id}` | Any authenticated | Get detail |
| PATCH | `/{id}` | SatManagerDep | Update |
| DELETE | `/{id}` | SatManagerDep | Soft-delete |

**Assistances** — prefix `/sat/assistances`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List (filter by status, priority, technician_id, customer_id, date range) |
| POST | `/` | SatManagerDep | Create |
| GET | `/{id}` | Any authenticated | Get detail (eager-load report + attachments) |
| PATCH | `/{id}` | SatManagerDep | Update |
| PATCH | `/{id}/status` | SatManagerDep + Technician (where `technician_id` matches current user's employee) | Update status only |
| DELETE | `/{id}` | SatManagerDep | Soft-delete |

**Intervention Reports** — prefix `/sat/reports`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List (filter by report_status) |
| POST | `/` | SatManagerDep + Technician (own assistance) | Create |
| GET | `/{id}` | Any authenticated | Get detail |
| PATCH | `/{id}` | SatManagerDep + Technician (where `technician_id` matches current user's employee) | Update |
| DELETE | `/{id}` | SatManagerDep | Soft-delete |

**Attachments** — prefix `/sat/attachments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | SatManagerDep + Technician (where `technician_id` matches current user's employee) | Upload (multipart, linked to report or assistance) |
| DELETE | `/{id}` | SatManagerDep | Delete |

**Service Types** — prefix `/sat/service-types`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List |
| POST | `/` | SatManagerDep | Create |
| PATCH | `/{id}` | SatManagerDep | Update |
| DELETE | `/{id}` | SatManagerDep | Soft-delete |

**Specializations** — prefix `/sat/specializations`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List |
| POST | `/` | SatManagerDep | Create |
| PATCH | `/{id}` | SatManagerDep | Update |
| DELETE | `/{id}` | SatManagerDep | Soft-delete |

**Technicians** — prefix `/sat/technicians`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any authenticated | List employees where is_sat_technician=true (includes specializations) |
| GET | `/{id}` | Any authenticated | Get technician detail + their assistances |

## 5. Frontend Structure

### 5.1 Pages

```
frontend/src/app/(dashboard)/sat/
├── page.tsx                              # Dashboard
├── loading.tsx
├── error.tsx
├── customers/
│   ├── page.tsx                          # List
│   ├── new/page.tsx                      # Create
│   └── [id]/
│       ├── page.tsx                      # Detail (tabs: Info, Contacts, Machines, History)
│       └── edit/page.tsx                 # Edit
├── machines/
│   ├── page.tsx                          # List
│   ├── new/page.tsx                      # Create
│   └── [id]/
│       ├── page.tsx                      # Detail
│       └── edit/page.tsx                 # Edit
├── assistances/
│   ├── page.tsx                          # List
│   ├── new/page.tsx                      # Create
│   └── [id]/
│       ├── page.tsx                      # Detail (status actions, report link, attachments)
│       └── edit/page.tsx                 # Edit
├── reports/
│   ├── page.tsx                          # List
│   ├── new/page.tsx                      # Create
│   └── [id]/
│       ├── page.tsx                      # Detail
│       └── edit/page.tsx                 # Edit
├── technicians/
│   ├── page.tsx                          # List (read-only, filtered employees)
│   └── [id]/
│       └── page.tsx                      # Detail (profile + specializations + assistances)
└── settings/
    ├── service-types/
    │   ├── page.tsx                      # List
    │   ├── new/page.tsx                  # Create
    │   └── [id]/edit/page.tsx            # Edit
    └── specializations/
        ├── page.tsx                      # List
        ├── new/page.tsx                  # Create
        └── [id]/edit/page.tsx            # Edit
```

Total: ~25 page files.

### 5.2 API Service Files

```
frontend/src/lib/api/
├── sat-customers.ts          # customersService
├── sat-contacts.ts           # contactsService
├── sat-machines.ts           # machinesService
├── sat-assistances.ts        # assistancesService
├── sat-reports.ts            # reportsService
├── sat-attachments.ts        # attachmentsService
├── sat-service-types.ts      # serviceTypesService
├── sat-specializations.ts    # specializationsService
└── sat-technicians.ts        # techniciansService
```

All follow existing pattern: singleton object with `getAll()`, `getById()`, `create()`, `update()`, `delete()` methods. Snake_case ↔ camelCase transformation via transformer functions.

### 5.3 TypeScript Types

Added to `frontend/src/types/index.ts`:

```typescript
// SAT Enums
type AssistanceStatus = "requested" | "scheduled" | "en_route" | "on_site" | "completed" | "reviewed" | "cancelled";
type AssistancePriority = "low" | "medium" | "high" | "critical";
type MachineType = "cnc" | "software";
type ReportStatus = "draft" | "submitted" | "approved";
type AttachmentFileType = "photo" | "audio" | "document";
type AttachmentSource = "whatsapp" | "web_upload";

// SAT Entities
interface SatCustomer extends BaseEntity { ... }
interface SatContact extends BaseEntity { ... }
interface SatMachine extends BaseEntity { ... }
interface SatAssistance extends BaseEntity { ... }
interface SatInterventionReport extends BaseEntity { ... }
interface SatAttachment extends BaseEntity { ... }
interface SatServiceType extends BaseEntity { ... }
interface SatSpecialization extends BaseEntity { ... }
```

### 5.4 Navigation

`satNavigation` array added to `mock-data.ts`. Detected in `app-shell.tsx` via `pathname.startsWith('/sat')`. Module branding: "SAT Manager" with `Headset` icon.

### 5.5 i18n Keys

New keys added under `sat.*` namespace in both `en.json` and `pt.json`:

- `sat.dashboard.title`, `sat.dashboard.totalAssistances`, etc.
- `sat.customers.title`, `sat.customers.name`, `sat.customers.empty`, etc.
- `sat.assistances.status.requested`, `sat.assistances.status.scheduled`, etc.
- `sat.reports.status.draft`, etc.
- `navigation.sat.dashboard`, `navigation.sat.customers`, etc.

### 5.6 Key UX Decisions

- **Contacts**: Inline CRUD within Customer Detail page (dialog-based), no standalone pages
- **Customer Detail**: Tabbed view (Info, Contacts, Machines, History)
- **Assistance Detail**: Status action buttons, linked report card, attachment gallery
- **Technicians**: Read-only filtered view of employees; editing technician status happens in employee management
- **Attachments**: Upload via file input on report/assistance pages; no standalone attachment list page in navigation

## 6. Authorization

### New Role

`sat_manager` added to `UserRole` enum.

### Access Matrix

| Resource | admin | sat_manager | technician | viewer |
|---|---|---|---|---|
| Customers | full CRUD | full CRUD | read | read |
| Contacts | full CRUD | full CRUD | read | read |
| Machines | full CRUD | full CRUD | read | read |
| Assistances | full CRUD | full CRUD | read + status update (own) | read |
| Reports | full CRUD | full CRUD | create/edit (own assistance) | read |
| Attachments | full CRUD | full CRUD | upload (own) | read |
| Service Types | full CRUD | full CRUD | read | read |
| Specializations | full CRUD | full CRUD | read | read |
| Technicians | read | read | read (own) | read |

## 7. Alembic Migration

Single migration file that:
1. Adds `is_sat_technician` column to `employees` table (default `false`)
2. Creates all 9 SAT tables
3. Seeds `sat_specializations` with: cnc_mechanical, cnc_electrical, cimco_software, phc_software
4. Seeds `sat_service_types` with: cnc_mechanical, cnc_electrical, cimco_software, phc_software, other
5. Adds `sat_manager` to `user_roles` enum type in PostgreSQL

## 8. Testing

### Backend Smoke Tests

File: `backend/tests/smoke/test_sat_*.py`

- CRUD for each entity (create, read, update, delete)
- Contact nested under customer
- Assistance status update
- Technician list filtering
- Authorization checks (technician cannot delete customer)
- Cascade deletes (delete customer → contacts deleted)

### Frontend

Manual testing via Playwright (deferred to implementation phase):
- Navigate all pages
- Create/edit/delete each entity
- Filter and search
- Tab navigation on customer detail
- Contact inline CRUD dialogs

## 9. Out of Scope

Explicitly excluded from this sub-project:
- PHC SQL Server sync logic (phc_id fields are present but unused)
- WhatsApp integration (WAHA webhooks, message routing)
- AI processing (transcription, report structuring — fields exist but stay null)
- SLA enforcement (deadline fields exist but no tracking/alerting)
- Customer digital signatures (field exists but no capture UI)
- File upload to S3/R2 (attachment records created, actual upload deferred)
- Assistance calendar view (list view only in this sub-project)
- Recurring issue detection
- Dashboard KPI calculations (placeholder cards only)
