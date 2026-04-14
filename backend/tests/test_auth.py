"""Authentication endpoint tests."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User


def test_login_success(
    client: TestClient,
    db_session: Session,
    test_admin_user: User,
):
    """Test successful login."""
    response = client.post(
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


def test_login_invalid_password(
    client: TestClient,
    db_session: Session,
    test_admin_user: User,
):
    """Test login with invalid password."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"] == "authentication_error"


def test_login_invalid_email(
    client: TestClient,
    db_session: Session,
):
    """Test login with non-existent email."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 401


def test_refresh_token(
    client: TestClient,
    db_session: Session,
    test_admin_user: User,
):
    """Test token refresh."""
    # First login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "testpassword123",
        },
    )
    assert login_response.status_code == 200
    tokens = login_response.json()

    # Refresh the token
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


def test_refresh_invalid_token(client: TestClient):
    """Test refresh with invalid token."""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"},
    )
    assert response.status_code == 401


def test_login_missing_fields_returns_422(client: TestClient):
    """Test login with missing required fields returns 422."""
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


def test_register_missing_fields_returns_422(client: TestClient):
    """Test register with missing required fields returns 422."""
    response = client.post("/api/v1/auth/register", json={})
    assert response.status_code == 422


def test_forgot_password_always_returns_200(client: TestClient, db_session: Session):
    """Test forgot-password always returns 200 (prevents email enumeration)."""
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "doesnotexist@example.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_forgot_password_missing_email_returns_422(client: TestClient):
    """Test forgot-password with missing email returns 422."""
    response = client.post("/api/v1/auth/forgot-password", json={})
    assert response.status_code == 422


def test_reset_password_invalid_token(client: TestClient, db_session: Session):
    """Test reset-password with invalid token returns error."""
    response = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid-token", "new_password": "newpass12345"},
    )
    # Should fail because token is invalid
    assert response.status_code in (400, 401, 404, 422)


def test_reset_password_missing_fields_returns_422(client: TestClient):
    """Test reset-password with missing fields returns 422."""
    response = client.post("/api/v1/auth/reset-password", json={})
    assert response.status_code == 422


def test_messaging_channels(client: TestClient):
    """Test messaging channels endpoint returns expected shape."""
    response = client.get("/api/v1/auth/messaging-channels")
    assert response.status_code == 200
    data = response.json()
    assert "channels" in data
    assert "email_enabled" in data
    assert "whatsapp_enabled" in data


def test_employee_login_missing_fields_returns_422(client: TestClient):
    """Test employee-login with missing fields returns 422."""
    response = client.post("/api/v1/auth/employee-login", json={})
    assert response.status_code == 422
