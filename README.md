# DNC Hub — Fleet & Tools ERP

Modular ERP platform for DNC Tecnica. Currently includes Fleet Management and Tool Management modules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) · React 19 · shadcn/ui · Tailwind CSS v4 · i18next |
| Backend | FastAPI · Python 3.12+ · SQLAlchemy 2.0 (sync) · Alembic · JWT auth |
| Database | PostgreSQL on Neon (psycopg driver) |
| Infra | Railway (backend) · Turborepo (monorepo) |

## Repository Structure

```
dnchub/
  backend/          # FastAPI application
  frontend/         # Next.js application
  package.json      # Monorepo root (workspaces)
  turbo.json        # Turborepo task pipeline
```

## Getting Started

### Prerequisites

- Node.js >= 20
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### 1. Clone and install

```bash
git clone https://github.com/rogeriosantos/dnchub-app.git
cd dnchub-app
npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Neon DB connection string and JWT secret

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your API URL
```

### 3. Run database migrations

```bash
npm run backend:migrate
```

### 4. Start development servers

```bash
# Both services via Turborepo
npm run dev

# Or individually
npm run frontend:dev   # http://localhost:3000
npm run backend:dev    # http://localhost:8000
```

## Backend Commands

```bash
npm run backend:dev      # Start FastAPI dev server
npm run backend:migrate  # Run Alembic migrations
npm run backend:seed     # Seed database with test data
npm run backend:lint     # Run ruff linter/formatter
npm run backend:test     # Run pytest
```

## Frontend Commands

```bash
npm run frontend:dev     # Start Next.js dev server
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run typecheck        # TypeScript check all packages
```

## Modules

- **Fleet Management** — Vehicles, fuel tracking, maintenance, GPS, tickets
- **Tool Management** — Tool inventory, cases, assignments, calibrations

## Deployment

- Backend: Railway (`railway.toml`, `Procfile`)
- Frontend: Vercel or Railway (standard Next.js)
