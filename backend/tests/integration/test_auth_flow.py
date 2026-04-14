"""Integration tests for authentication flow."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User


class TestAuthFlowIntegration:
    """Test full auth flow: register -> login -> use token -> refresh."""

    def test_register_then_login(
        self, client: TestClient, db_session: Session
    ):
        """Register a new org/user, then login with those credentials."""
        # Register
        register_res = client.post(
            "/api/v1/auth/register",
            json={
                "organization_name": "Integration Test Org",
                "email": "integ@test.com",
                "password": "integpass12345",
                "first_name": "Integ",
                "last_name": "Tester",
            },
        )
        assert register_res.status_code == 201
        tokens = register_res.json()
        assert "access_token" in tokens

        # Login with the same credentials
        login_res = client.post(
            "/api/v1/auth/login",
            json={
                "email": "integ@test.com",
                "password": "integpass12345",
            },
        )
        assert login_res.status_code == 200
        login_tokens = login_res.json()
        assert "access_token" in login_tokens

    def test_login_then_access_protected_endpoint(
        self,
        client: TestClient,
        db_session: Session,
        test_admin_user: User,
    ):
        """Login then use token to access a protected endpoint."""
        # Login
        login_res = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@test.com",
                "password": "testpassword123",
            },
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        me_res = client.get("/api/v1/users/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "admin@test.com"

    def test_login_then_refresh_then_access(
        self,
        client: TestClient,
        db_session: Session,
        test_admin_user: User,
    ):
        """Login, refresh token, then access protected endpoint with new token."""
        # Login
        login_res = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@test.com",
                "password": "testpassword123",
            },
        )
        assert login_res.status_code == 200
        refresh_token = login_res.json()["refresh_token"]

        # Refresh
        refresh_res = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_res.status_code == 200
        new_token = refresh_res.json()["access_token"]

        # Access with new token
        headers = {"Authorization": f"Bearer {new_token}"}
        me_res = client.get("/api/v1/users/me", headers=headers)
        assert me_res.status_code == 200
