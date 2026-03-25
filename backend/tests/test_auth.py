"""Authentication endpoint tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


@pytest.mark.asyncio
async def test_login_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_admin_user: User,
):
    """Test successful login."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data


@pytest.mark.asyncio
async def test_login_invalid_password(
    client: AsyncClient,
    db_session: AsyncSession,
    test_admin_user: User,
):
    """Test login with invalid password."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"] == "authentication_error"


@pytest.mark.asyncio
async def test_login_invalid_email(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Test login with non-existent email."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(
    client: AsyncClient,
    db_session: AsyncSession,
    test_admin_user: User,
):
    """Test token refresh."""
    # First login to get tokens
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "testpassword123",
        },
    )
    assert login_response.status_code == 200
    tokens = login_response.json()

    # Refresh the token
    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    """Test refresh with invalid token."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"},
    )
    assert response.status_code == 401
