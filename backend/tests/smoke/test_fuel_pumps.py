"""Smoke tests for fuel pump endpoints."""

from fastapi.testclient import TestClient


class TestFuelPumpSmoke:
    """Verify fuel pump endpoints return expected status codes."""

    def test_list_fuel_pumps_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/fuel-pumps")
        assert res.status_code in (401, 403)

    def test_list_fuel_pumps(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/fuel-pumps", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_pump_alerts(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/fuel-pumps/alerts", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_pump_stats(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/fuel-pumps/stats", headers=admin_headers)
        assert res.status_code == 200

    def test_create_fuel_pump_missing_fields_returns_422(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.post("/api/v1/fuel-pumps", json={}, headers=admin_headers)
        assert res.status_code == 422

    def test_get_fuel_pump_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/fuel-pumps/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_fuel_pump_nonexistent_returns_204(
        self, client: TestClient, admin_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/fuel-pumps/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 204
