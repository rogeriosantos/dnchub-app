"""Smoke tests for tool assignment endpoints."""

from fastapi.testclient import TestClient


class TestToolAssignmentSmoke:
    """Verify tool assignment endpoints return expected status codes."""

    def test_list_assignments_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/tool-assignments")
        assert res.status_code in (401, 403)

    def test_list_assignments(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tool-assignments", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_assignment_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post(
            "/api/v1/tool-assignments", json={}, headers=manager_headers
        )
        assert res.status_code == 422

    def test_get_assignment_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/tool-assignments/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404
