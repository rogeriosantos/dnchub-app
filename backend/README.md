# FleetOptima Backend

FastAPI backend for the FleetOptima Fleet Management ERP system.

## Requirements

- Python 3.11+
- PostgreSQL 14+
- UV (recommended) or pip

## Quick Start

### 1. Install Dependencies

Using UV (recommended):
```bash
cd backend
uv sync
```

Using pip:
```bash
cd backend
pip install -e .
```

### 2. Configure Environment

Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/fleetoptima
SECRET_KEY=your-secret-key-here
```

### 3. Create Database

```sql
CREATE DATABASE fleetoptima;
```

### 4. Run Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 5. Seed Database (Optional)

```bash
python -m app.db.seed
```

### 6. Start Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Docs (Swagger): http://localhost:8000/api/docs
- Docs (ReDoc): http://localhost:8000/api/redoc

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/            # Migration files
│   └── env.py               # Alembic configuration
├── app/
│   ├── api/                 # API endpoints
│   │   ├── deps.py          # Dependencies (auth, db)
│   │   └── v1/              # API version 1 routes
│   ├── core/                # Core configuration
│   │   ├── config.py        # Settings management
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── security.py      # JWT & password utilities
│   ├── db/                  # Database
│   │   ├── base.py          # SQLAlchemy setup
│   │   └── seed.py          # Database seeding
│   ├── models/              # SQLAlchemy models
│   │   ├── enums.py         # Enum types
│   │   └── *.py             # Entity models
│   ├── schemas/             # Pydantic schemas
│   │   └── *.py             # Request/Response schemas
│   ├── services/            # Business logic
│   │   ├── base.py          # Generic CRUD service
│   │   └── *.py             # Entity services
│   └── main.py              # FastAPI application
├── tests/                   # Test files
├── alembic.ini              # Alembic configuration
├── pyproject.toml           # Project dependencies
└── README.md
```

## API Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/api/v1/auth` | Authentication (login, refresh, driver PIN) |
| Organizations | `/api/v1/organizations` | Organization management |
| Users | `/api/v1/users` | User management |
| Vehicles | `/api/v1/vehicles` | Vehicle & group management |
| Drivers | `/api/v1/drivers` | Driver management |
| Fuel | `/api/v1/fuel` | Fuel entry tracking & analytics |
| Maintenance | `/api/v1/maintenance` | Tasks & schedules |
| Cost Centers | `/api/v1/cost-centers` | Cost allocation & budgets |
| GPS | `/api/v1/gps` | Trips, positions, geofences, alerts |
| Documents | `/api/v1/documents` | Document management |
| Notifications | `/api/v1/notifications` | User notifications |
| Dashboard | `/api/v1/dashboard` | Aggregated metrics & stats |

## Authentication

The API uses JWT tokens for authentication:

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fleetoptima.demo", "password": "admin123"}'

# Use token
curl http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer <access_token>"
```

### User Roles

- **ADMIN**: Full system access
- **FLEET_MANAGER**: Manage vehicles, drivers, maintenance
- **OPERATOR**: Basic operations access
- **VIEWER**: Read-only access

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

## Development

### Code Style

The project uses:
- Ruff for linting and formatting
- MyPy for type checking

```bash
# Format code
ruff format .

# Check linting
ruff check .

# Type check
mypy app
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `APP_NAME` | Application name | FleetOptima API |
| `APP_VERSION` | API version | 1.0.0 |
| `DEBUG` | Debug mode | false |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiry | 7 |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:3000 |

## Demo Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fleetoptima.demo | admin123 |
| Fleet Manager | manager@fleetoptima.demo | manager123 |
| Operator | operator@fleetoptima.demo | operator123 |

Driver PIN authentication (for POS):
| Employee ID | PIN |
|-------------|-----|
| DRV-001 | 1234 |
| DRV-002 | 5678 |
| DRV-003 | 9012 |
# Fleet Optima Backend
