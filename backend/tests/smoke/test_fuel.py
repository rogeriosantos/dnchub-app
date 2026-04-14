"""Smoke tests for fuel endpoints."""

from fastapi.testclient import TestClient


class TestFuelSmoke:
    """Verify fuel endpoints return expected status codes."""

    def test_list_fuel_entries_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/fuel")
        assert res.status_code in (401, 403)

    def test_list_fuel_entries(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/fuel", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_fuel_entry_missing_fields_returns_422(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.post("/api/v1/fuel", json={}, headers=admin_headers)
        assert res.status_code == 422

    def test_get_fuel_entry_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/fuel/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_update_fuel_entry_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.patch(
            "/api/v1/fuel/00000000-0000-0000-0000-000000000000",
            json={"notes": "Updated"},
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_fuel_entry_nonexistent_returns_204(
        self, client: TestClient, admin_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/fuel/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 204

    def test_fuel_analytics_requires_dates(self, client: TestClient, admin_headers: dict):
        """GET /fuel/analytics without required dates returns 422."""
        res = client.get("/api/v1/fuel/analytics", headers=admin_headers)
        assert res.status_code == 422

    def test_fuel_analytics_with_dates(self, client: TestClient, admin_headers: dict):
        """GET /fuel/analytics with dates returns 200."""
        res = client.get(
            "/api/v1/fuel/analytics",
            params={"start_date": "2024-01-01", "end_date": "2024-12-31"},
            headers=admin_headers,
        )
        assert res.status_code == 200
