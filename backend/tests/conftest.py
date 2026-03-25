"""Pytest configuration and fixtures."""

import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.base import Base, get_db
from app.main import app
from app.models import Organization, User
from app.models.enums import UserRole

# Test database URL
TEST_DATABASE_URL = settings.database_url.replace(
    "/fleetoptima", "/fleetoptima_test"
)

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

# Create test session factory
TestSessionFactory = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create database session for testing."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionFactory() as session:
        yield session
        await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sync_client(db_session: AsyncSession) -> Generator[TestClient, None, None]:
    """Create synchronous test client."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_organization(db_session: AsyncSession) -> Organization:
    """Create test organization."""
    org = Organization(
        name="Test Organization",
        slug="test-org",
        is_active=True,
    )
    db_session.add(org)
    await db_session.flush()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def test_admin_user(
    db_session: AsyncSession, test_organization: Organization
) -> User:
    """Create test admin user."""
    user = User(
        organization_id=test_organization.id,
        email="admin@test.com",
        password_hash=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_fleet_manager(
    db_session: AsyncSession, test_organization: Organization
) -> User:
    """Create test fleet manager user."""
    user = User(
        organization_id=test_organization.id,
        email="manager@test.com",
        password_hash=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="Manager",
        role=UserRole.FLEET_MANAGER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_token(test_admin_user: User) -> str:
    """Create admin access token."""
    return create_access_token(
        subject=test_admin_user.id,
        organization_id=test_admin_user.organization_id,
        role=test_admin_user.role.value,
    )


@pytest_asyncio.fixture
async def manager_token(test_fleet_manager: User) -> str:
    """Create fleet manager access token."""
    return create_access_token(
        subject=test_fleet_manager.id,
        organization_id=test_fleet_manager.organization_id,
        role=test_fleet_manager.role.value,
    )


@pytest_asyncio.fixture
async def admin_headers(admin_token: str) -> dict[str, str]:
    """Create headers with admin token."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
async def manager_headers(manager_token: str) -> dict[str, str]:
    """Create headers with manager token."""
    return {"Authorization": f"Bearer {manager_token}"}
