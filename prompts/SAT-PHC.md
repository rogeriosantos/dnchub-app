# App Forge Context

## App Name

! DNC Hub — Field Service Management Platform

## Problem Statement

A technical assistance company serving CNC shops and software clients currently manages all field service operations inside PHC ERP, which
is rigid, not mobile-friendly, and lacks modern communication channels. Technicians waste time writing reports manually, dispatchers lack
real-time visibility, and customers have no transparency into service status. The goal is to build a customizable platform that syncs
assistance data from PHC and adds AI-powered reporting, WhatsApp automation, and a modern web interface for all stakeholders.

## Target Users

- **Technician (Field)**: Mobile-first user. Views daily schedule, travels to customer sites, performs CNC machine or software
  interventions, submits reports via WhatsApp audio/photos or web app. Needs minimal friction — works with gloves, in noisy environments.
- **Dispatcher/Manager**: Office user. Assigns and schedules assistance requests, monitors technician availability and calendar, reviews and
  approves intervention reports, tracks SLA compliance, identifies recurring issues.
- **Customer**: Views their own assistance history, sees technician ETA and en-route status, receives WhatsApp notifications, can request
  new assistance via WhatsApp or platform (v2 for self-service portal, WhatsApp requests in v1).
- **Admin**: Configures system settings, manages technician profiles, manages integration connections (PHC sync, WAHA, AI keys), manages
  user roles and permissions.

## Core Features (MVP)

### Data Sync

1. **PHC SQL Server Sync**: Read-only sync from PHC SQL Server database — pull assistance records, customer data, and technician assignments
   on a scheduled basis (cron) with manual trigger option.
2. **Data Normalization**: Map PHC schema to DNC Hub entities, handle field mapping, deduplication, and conflict resolution.

### Assistance Management

3. **Assistance Calendar**: Visual calendar (day/week/month) showing all scheduled interventions with filters by technician, customer,
   service type, and status.
4. **Assistance Detail View**: Full intervention record — customer, machine, problem description, assigned technician, scheduled date/time,
   status workflow (Scheduled → In Progress → Completed → Reviewed).
5. **Service Type Classification**: Track intervention types — CNC Mechanical, CNC Electrical, Cimco Software, PHC Software, Other.
6. **SLA Tracking**: Track response time (assignment → first contact) and resolution time (assignment → completion) per service type, with
   visual indicators for approaching/breached SLAs.
7. **Recurring Issue Detection**: Flag machines/customers with repeated issues — surface patterns (e.g., "Machine X has had 4 electrical
   faults in 3 months").

### Technician Reporting

8. **Structured Intervention Report**: Form with fields — problem description, diagnosis, actions taken, parts replaced, time spent
   (travel + on-site), machine model/serial, next steps/recommendations, status.
9. **AI Audio-to-Report**: Technician sends voice message via WhatsApp → AI transcribes → AI structures into report fields (problem,
   solution, parts used, time, next steps) → saves as draft for review.
10. **Photo Attachments**: Technician sends photos via WhatsApp or uploads in web app — attached to the intervention record (before/after,
    machine state, parts).
11. **Customer Signature**: Digital signature capture on the intervention report (web app, later mobile app).

### WhatsApp Integration (WAHA)

12. **Daily Schedule Notification**: Each morning, technicians receive their day's schedule via WhatsApp — customer name, address, problem
    summary, scheduled time.
13. **En-Route Notification**: When technician marks "en route", customer receives WhatsApp message with technician name and estimated
    arrival.
14. **Photo/Audio Intake**: WAHA webhook receives media from technicians, routes to correct intervention based on context (active assignment
    or explicit reference).
15. **Customer Assistance Requests**: Customers can send WhatsApp messages to request new assistance — AI parses the message, creates a
    draft assistance request for dispatcher review.

### AI Processing

16. **Audio Transcription**: Whisper API (OpenAI) or equivalent — convert voice messages to text.
17. **Report Structuring**: LLM (Anthropic Claude or OpenAI GPT) — take raw transcription and extract structured fields, improve
    grammar/clarity, translate if needed.
18. **Customer Request Parsing**: LLM parses incoming WhatsApp messages from customers to identify urgency, machine, problem type, and
    preferred schedule.
19. **AI Provider Flexibility**: Support both Anthropic and OpenAI API keys — configurable per tenant/instance.

### Customer & Technician Management

20. **Customer Directory**: List of all customers synced from PHC — name, address, contact info, machines on-site, assistance history,
    notes.
21. **Technician Directory**: List of technicians — name, specializations (CNC mechanical, electrical, software), availability, current
    assignments, performance metrics.
22. **Machine Registry**: Track machines per customer — model, serial number, installation date, maintenance history, linked assistance
    records.

### Dashboard & Analytics

23. **Manager Dashboard**: KPIs — open assistances, overdue SLAs, technician utilization, assistances this week/month, avg resolution time.
24. **Customer History View**: Timeline of all interventions for a customer, filterable by machine and service type.

## User Flows

### Technician Daily Flow

1. Receives WhatsApp message at 7:30 AM with day's schedule
2. Opens first assistance → marks "en route" (customer gets WhatsApp notification)
3. Arrives → marks "on site" → works on machine
4. Finishes → sends WhatsApp audio describing what was done, parts used, time spent
5. AI transcribes and structures into report draft
6. Sends photos of completed work via WhatsApp
7. Opens web app (or later mobile app) → reviews AI-generated report → adjusts if needed
8. Customer signs on device → report finalized
9. Moves to next assistance

### Dispatcher Flow

1. Logs in → sees dashboard with today's calendar and open requests
2. New assistance request comes in (from PHC sync or WhatsApp customer message)
3. Reviews request → assigns technician based on availability, location, specialization
4. Monitors progress throughout the day — sees real-time status updates
5. Reviews completed intervention reports → approves or requests corrections
6. End of week: reviews SLA compliance and recurring issues

### Customer Flow (v1 — WhatsApp only, no self-service portal)

1. Has a machine issue → sends WhatsApp message describing the problem
2. Receives confirmation that request was received
3. Receives notification when technician is assigned and scheduled
4. Receives "en route" notification with technician name
5. Technician arrives and resolves issue
6. Signs the digital report
7. Can request assistance history summary via WhatsApp

### Admin Flow

1. Configures PHC SQL Server connection and sync schedule
2. Sets up WAHA webhook URL and WhatsApp number
3. Configures AI provider (Anthropic/OpenAI) and API keys
4. Manages user accounts and role assignments
5. Configures SLA thresholds per service type
6. Monitors system health (sync status, API usage, message delivery)

## Data Entities

- **Customer**: id, phc_id, name, tax_id, address, city, postal_code, phone, email, notes, created_at, updated_at, synced_at
- **Contact**: id, customer_id, name, role, phone, email, is_whatsapp (a customer may have multiple contacts)
- **Machine**: id, customer_id, brand, model, serial_number, installation_date, location_notes, machine_type (CNC/Software), notes
- **Technician**: id, user_id, name, phone, email, specializations[] (cnc_mechanical, cnc_electrical, cimco_software, phc_software),
  is_active
- **Assistance**: id, phc_id, customer_id, machine_id, technician_id, service_type, priority (low/medium/high/critical), status
  (requested/scheduled/en_route/on_site/completed/reviewed/cancelled), scheduled_date, scheduled_time, problem_description,
  sla_response_deadline, sla_resolution_deadline, created_at, updated_at
- **InterventionReport**: id, assistance_id, technician_id, diagnosis, actions_taken, parts_replaced[], time_travel_minutes,
  time_onsite_minutes, next_steps, ai_raw_transcription, ai_structured_draft, customer_signature_url, status (draft/submitted/approved),
  created_at, submitted_at, approved_at
- **Attachment**: id, intervention_report_id, assistance_id, file_url, file_type (photo/audio/document), source (whatsapp/web_upload),
  caption, created_at
- **WhatsAppMessage**: id, waha_message_id, direction (inbound/outbound), from_number, to_number, message_type (text/audio/image/document),
  content, media_url, linked_entity_type, linked_entity_id, processed, created_at
- **SyncLog**: id, sync_type, status (running/completed/failed), records_processed, records_created, records_updated, errors[], started_at,
  completed_at
- **User**: id, email, name, role (admin/manager/technician/customer), password_hash, is_active, created_at
- **AuditLog**: id, user_id, action, entity_type, entity_id, changes_json, ip_address, created_at

## External Integrations

- **PHC ERP (SQL Server)**: Direct SQL read-only access to assistance module tables. Scheduled sync (e.g., every 15 min) + manual trigger.
  Connection via pyodbc/aioodbc.
- **WAHA (WhatsApp HTTP API)**: Self-hosted WhatsApp gateway. Webhooks for inbound messages (text, audio, images). REST API for outbound
  messages. Handles technician reports, customer notifications, schedule delivery, and customer requests.
- **OpenAI API**: Whisper for audio transcription. GPT for report structuring and customer message parsing. Configurable model selection.
- **Anthropic API**: Claude for report structuring and customer message parsing. Alternative to OpenAI — admin configurable.
- **File Storage**: S3-compatible storage (e.g., Cloudflare R2, AWS S3, or Vercel Blob) for photos, audio files, and customer signatures.

## Auth & Roles

- **Auth Method**: JWT-based authentication with refresh tokens. Email + password login for web app. Future: OAuth for mobile app.
- **Roles**:
  - `admin` — full system access, settings, user management, integration config
  - `manager` — calendar, assistance CRUD, report review/approval, analytics, technician management
  - `technician` — view own schedule, submit reports, update assistance status
  - `customer` — view own assistance history (v2 web portal, v1 WhatsApp only)
- **Data isolation**: Customers see only their own data. Technicians see only their assignments. Managers see everything. Admin manages
  everything.

## Non-Goals (v1)

- Invoicing / billing — stays in PHC
- Parts / inventory management — manual text field in reports for now
- Customer self-service web portal — customers interact via WhatsApp only in v1
- GPS / route tracking for technicians
- React Native mobile app — planned for v2, web app is mobile-responsive in v1
- Write-back to PHC — read-only sync in v1
- Multi-tenant / multi-company support
- Offline mode

## Tech Stack

- **Frontend**: Next.js 16 + shadcn/ui + Tailwind CSS + TypeScript
- **Backend**: Python 3.12 + FastAPI + UV
- **Database**: PostgreSQL (Neon.Tech)
- **Auth**: JWT with role-based access control (custom, no external provider in v1)
- **PHC Sync**: pyodbc/aioodbc for SQL Server direct access, APScheduler or Celery for scheduled sync
- **WhatsApp**: WAHA (self-hosted) — webhook receiver + REST client
- **AI**: OpenAI Whisper (transcription) + Anthropic Claude or OpenAI GPT (structuring) — provider-agnostic service layer
- **File Storage**: S3-compatible (Cloudflare R2 or Vercel Blob)
- **Deployment**: Vercel (frontend) + Railway/Render (backend) + Neon (database)
- **Future (v2)**: React Native mobile app, customer portal, PHC write-back, offline support

## Open Questions

1. **PHC Schema**: What are the exact table/column names in the PHC SQL Server for assistance records, customers, and technicians? (Needed
   for sync mapping)
2. **WAHA Instance**: Is WAHA already deployed, or does it need to be set up? Which WhatsApp number will be used?
3. **Technician Identification**: How does the system match a WhatsApp message to a specific technician and their current active assistance?
   By phone number + active assignment?
4. **SLA Definitions**: What are the actual SLA thresholds per service type? (e.g., CNC critical = 4h response, 24h resolution?)
5. **File Storage Choice**: Preference between Cloudflare R2, AWS S3, or Vercel Blob?
6. **Customer Signatures**: Is a simple canvas-based signature sufficient, or do you need legally binding digital signatures?
7. **Language**: Is the platform UI in Portuguese (PT)? Reports in Portuguese? AI should output in Portuguese?
8. **Notification Schedule**: What time should daily schedules be sent? Is 7:30 AM correct?
9. **Existing Data Volume**: Roughly how many customers, technicians, and assistances per month? (Affects sync strategy and database design)
