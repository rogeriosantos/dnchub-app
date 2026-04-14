"""Smoke tests for cost center endpoints."""

from fastapi.testclient import TestClient


class TestCostCenterSmoke:
    """Verify cost center endpoints return expected status codes."""

    def test_list_cost_centers_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/cost-centers")
        assert res.status_code in (401, 403)

    def test_list_cost_centers(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/cost-centers", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_cost_center_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post("/api/v1/cost-centers", json={}, headers=manager_headers)
        assert res.status_code == 422

    def test_get_cost_center_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/cost-centers/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_update_cost_center_nonexistent_returns_404(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.patch(
            "/api/v1/cost-centers/00000000-0000-0000-0000-000000000000",
            json={"name": "Updated"},
            headers=manager_headers,
        )
        assert res.status_code == 404

    def test_delete_cost_center_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/cost-centers/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204
