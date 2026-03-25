"""Alembic environment configuration."""

import asyncio
import ssl
import sys
from logging.config import fileConfig
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# Fix for Windows: psycopg requires SelectorEventLoop, not ProactorEventLoop
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.db.base import Base

# Import all models to ensure they are registered with Base.metadata
from app.models import (  # noqa: F401
    CostAllocation,
    CostCenter,
    Document,
    Employee,
    FuelEntry,
    FuelPump,
    FuelPumpDelivery,
    Geofence,
    GpsAlert,
    MaintenanceSchedule,
    MaintenanceTask,
    Notification,
    NotificationPreferences,
    Organization,
    Ticket,
    Tool,
    ToolAssignment,
    ToolCalibration,
    ToolCase,
    ToolCategory,
    ToolLocation,
    Trip,
    TripPosition,
    User,
    Vehicle,
    VehicleGroup,
    VehicleGroupMember,
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def is_asyncpg_driver() -> bool:
    """Check if the database URL uses asyncpg driver."""
    return "+asyncpg" in settings.database_url


def get_url():
    """Get database URL from settings."""
    url = settings.database_url

    # Only remove sslmode for asyncpg - psycopg handles it in URL
    if is_asyncpg_driver():
        parsed = urlparse(url)
        if parsed.query:
            params = parse_qs(parsed.query)
            # Remove asyncpg-incompatible params
            params.pop("sslmode", None)
            params.pop("channel_binding", None)
            # Rebuild query string
            new_query = urlencode({k: v[0] for k, v in params.items()})
            url = urlunparse(parsed._replace(query=new_query))

    return url


def get_connect_args():
    """Get connect_args based on driver type."""
    # For psycopg, SSL is handled in the URL via sslmode=require
    # For asyncpg, we need to pass SSL context in connect_args
    if is_asyncpg_driver() and "sslmode=require" in settings.database_url:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        return {"ssl": ssl_context}
    return {}


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    url = get_url()
    connect_args = get_connect_args()

    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
