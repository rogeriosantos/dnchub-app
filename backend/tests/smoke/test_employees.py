"""Smoke tests for employee endpoints."""

from fastapi.testclient import TestClient


class TestEmployeeSmoke:
    """Verify employee endpoints return expected status codes."""

    def test_list_employees_unauthorized(self, client: TestClient):
        """Unauthenticated request returns 401/403."""
        res = client.get("/api/v1/employees")
        assert res.status_code in (401, 403)

    def test_list_employees(self, client: TestClient, admin_headers: dict):
        """Authenticated user can list employees."""
        res = client.get("/api/v1/employees", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_available_employees(self, client: TestClient, admin_headers: dict):
        """GET /employees/available returns list."""
        res = client.get("/api/v1/employees/available", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_expiring_licenses(self, client: TestClient, admin_headers: dict):
        """GET /employees/expiring-licenses returns list."""
        res = client.get("/api/v1/employees/expiring-licenses", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_employee_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        """POST /employees with empty body returns 422."""
        res = client.post("/api/v1/employees", json={}, headers=manager_headers)
        assert res.status_code == 422

    def test_get_employee_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        """GET /employees/{id} with nonexistent id returns 404."""
        res = client.get(
            "/api/v1/employees/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_update_employee_nonexistent_returns_404(
        self, client: TestClient, manager_headers: dict
    ):
        """PATCH /employees/{id} with nonexistent id returns 404."""
        res = client.patch(
            "/api/v1/employees/00000000-0000-0000-0000-000000000000",
            json={"first_name": "Updated"},
            headers=manager_headers,
        )
        assert res.status_code == 404

    def test_delete_employee_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/employees/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204
