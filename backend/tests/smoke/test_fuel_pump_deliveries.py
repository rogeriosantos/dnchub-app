"""Smoke tests for fuel pump delivery endpoints."""

from fastapi.testclient import TestClient


class TestFuelPumpDeliverySmoke:
    """Verify fuel pump delivery endpoints return expected status codes."""

    def test_list_deliveries_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/fuel-pump-deliveries")
        assert res.status_code in (401, 403)

    def test_list_deliveries(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/fuel-pump-deliveries", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_delivery_missing_fields_returns_422(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.post(
            "/api/v1/fuel-pump-deliveries", json={}, headers=admin_headers
        )
        assert res.status_code == 422

    def test_get_delivery_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/fuel-pump-deliveries/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_delivery_nonexistent_returns_204(
        self, client: TestClient, admin_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/fuel-pump-deliveries/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 204

    def test_delivery_summary_requires_dates(
        self, client: TestClient, admin_headers: dict
    ):
        """GET /fuel-pump-deliveries/summary without required dates returns 422."""
        res = client.get(
            "/api/v1/fuel-pump-deliveries/summary", headers=admin_headers
        )
        assert res.status_code == 422

    def test_delivery_summary_with_dates(
        self, client: TestClient, admin_headers: dict
    ):
        """GET /fuel-pump-deliveries/summary with dates returns 200."""
        res = client.get(
            "/api/v1/fuel-pump-deliveries/summary",
            params={"start_date": "2024-01-01", "end_date": "2024-12-31"},
            headers=admin_headers,
        )
        assert res.status_code == 200
