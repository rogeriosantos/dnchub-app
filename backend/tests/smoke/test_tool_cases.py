"""Smoke tests for tool case endpoints."""

from fastapi.testclient import TestClient


class TestToolCaseSmoke:
    """Verify tool case endpoints return expected status codes."""

    def test_list_tool_cases_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/tool-cases")
        assert res.status_code in (401, 403)

    def test_list_tool_cases(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tool-cases", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_tool_case_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post("/api/v1/tool-cases", json={}, headers=manager_headers)
        assert res.status_code == 422

    def test_get_tool_case_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/tool-cases/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_tool_case_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/tool-cases/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204
