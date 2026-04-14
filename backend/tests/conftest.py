"""Pytest configuration and fixtures.

Uses sync TestClient + sync SQLAlchemy with per-test transaction rollback
against the real Neon PostgreSQL database. Each test runs inside a
transaction that is rolled back at the end, so no data leaks between tests.
"""

from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.base import Base, get_db
from app.main import app
from app.models import Organization, User
from app.models.enums import UserRole

# Create a separate test engine with NullPool (one connection per test)
test_engine = create_engine(
    settings.database_sync_url,
    echo=False,
    poolclass=NullPool,
)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Create a transactional database session that rolls back after each test.

    Opens a real connection, starts a transaction, binds a Session to it,
    then rolls the transaction back at the end so no data persists.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    # If application code calls session.commit(), turn it into a flush
    # so the data is visible within the transaction but never committed.
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        nonlocal nested
        if trans.nested and not trans._parent.nested:
            nested = connection.begin_nested()

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create synchronous test client with database session override."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def test_organization(db_session: Session) -> Organization:
    """Create test organization."""
    org = Organization(
        id=str(uuid4()),
        name="Test Organization",
    )
    db_session.add(org)
    db_session.flush()
    db_session.refresh(org)
    return org


@pytest.fixture()
def test_admin_user(
    db_session: Session, test_organization: Organization
) -> User:
    """Create test admin user."""
    user = User(
        id=str(uuid4()),
        organization_id=test_organization.id,
        email="admin@test.com",
        password_hash=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.refresh(user)
    return user


@pytest.fixture()
def test_fleet_manager(
    db_session: Session, test_organization: Organization
) -> User:
    """Create test fleet manager user."""
    user = User(
        id=str(uuid4()),
        organization_id=test_organization.id,
        email="manager@test.com",
        password_hash=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="Manager",
        role=UserRole.FLEET_MANAGER,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.refresh(user)
    return user


@pytest.fixture()
def admin_token(test_admin_user: User) -> str:
    """Create admin access token."""
    return create_access_token(
        subject=test_admin_user.id,
        organization_id=test_admin_user.organization_id,
        role=test_admin_user.role.value,
    )


@pytest.fixture()
def manager_token(test_fleet_manager: User) -> str:
    """Create fleet manager access token."""
    return create_access_token(
        subject=test_fleet_manager.id,
        organization_id=test_fleet_manager.organization_id,
        role=test_fleet_manager.role.value,
    )


@pytest.fixture()
def admin_headers(admin_token: str) -> dict[str, str]:
    """Create headers with admin token."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def manager_headers(manager_token: str) -> dict[str, str]:
    """Create headers with manager token."""
    return {"Authorization": f"Bearer {manager_token}"}
