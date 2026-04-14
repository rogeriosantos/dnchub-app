"""Smoke tests for user endpoints."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User


class TestUserSmoke:
    """Verify user endpoints return expected status codes and response shape."""

    def test_list_users_unauthorized(self, client: TestClient):
        """Unauthenticated request returns 401/403."""
        res = client.get("/api/v1/users")
        assert res.status_code in (401, 403)

    def test_list_users_as_admin(self, client: TestClient, admin_headers: dict):
        """Admin can list users."""
        res = client.get("/api/v1/users", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_users_as_manager_forbidden(self, client: TestClient, manager_headers: dict):
        """Fleet manager cannot list users (admin only)."""
        res = client.get("/api/v1/users", headers=manager_headers)
        assert res.status_code == 403

    def test_get_current_user(self, client: TestClient, admin_headers: dict, test_admin_user: User):
        """GET /users/me returns current user."""
        res = client.get("/api/v1/users/me", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "admin@test.com"

    def test_update_current_user(self, client: TestClient, admin_headers: dict, test_admin_user: User):
        """PATCH /users/me updates current user profile."""
        res = client.patch(
            "/api/v1/users/me",
            json={"first_name": "Updated"},
            headers=admin_headers,
        )
        assert res.status_code == 200
        assert res.json()["first_name"] == "Updated"

    def test_create_user_returns_201(self, client: TestClient, admin_headers: dict):
        """POST /users with valid payload returns 201."""
        res = client.post(
            "/api/v1/users",
            json={
                "email": "newuser@test.com",
                "first_name": "New",
                "last_name": "User",
                "password": "securepass123",
                "role": "technician",
            },
            headers=admin_headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == "newuser@test.com"
        assert "id" in data

    def test_create_user_missing_fields_returns_422(self, client: TestClient, admin_headers: dict):
        """POST /users with empty body returns 422."""
        res = client.post("/api/v1/users", json={}, headers=admin_headers)
        assert res.status_code == 422

    def test_get_user_nonexistent_returns_404(self, client: TestClient, admin_headers: dict):
        """GET /users/{id} with nonexistent id returns 404."""
        res = client.get(
            "/api/v1/users/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_user(self, client: TestClient, admin_headers: dict, test_admin_user: User, db_session: Session):
        """DELETE /users/{id} returns 204."""
        # Create a user to delete (not the admin itself)
        from app.core.security import get_password_hash
        from uuid import uuid4

        user = User(
            id=str(uuid4()),
            organization_id=test_admin_user.organization_id,
            email="todelete@test.com",
            password_hash=get_password_hash("pass12345678"),
            first_name="Delete",
            last_name="Me",
            role="technician",
            is_active=True,
        )
        db_session.add(user)
        db_session.flush()
        db_session.refresh(user)

        res = client.delete(f"/api/v1/users/{user.id}", headers=admin_headers)
        assert res.status_code == 204
