"""Smoke tests for tool endpoints."""

from fastapi.testclient import TestClient


class TestToolSmoke:
    """Verify tool endpoints return expected status codes."""

    def test_list_tools_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/tools")
        assert res.status_code in (401, 403)

    def test_list_tools(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tools", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_tools_unassigned(self, client: TestClient, admin_headers: dict):
        res = client.get(
            "/api/v1/tools", params={"unassigned": True}, headers=admin_headers
        )
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_tool_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post("/api/v1/tools", json={}, headers=manager_headers)
        assert res.status_code == 422

    def test_get_tool_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/tools/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_tool_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/tools/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204

    def test_get_tool_by_erp_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/tools/by-erp/NONEXISTENT-CODE",
            headers=admin_headers,
        )
        assert res.status_code == 404
