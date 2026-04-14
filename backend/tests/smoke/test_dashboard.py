"""Smoke tests for dashboard endpoints."""

from fastapi.testclient import TestClient


class TestDashboardSmoke:
    """Verify dashboard endpoints return expected status codes."""

    def test_fleet_status_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/dashboard/fleet-status")
        assert res.status_code in (401, 403)

    def test_fleet_status(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/dashboard/fleet-status", headers=admin_headers)
        assert res.status_code == 200

    def test_stats(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/dashboard/stats", headers=admin_headers)
        assert res.status_code == 200

    def test_alerts(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/dashboard/alerts", headers=admin_headers)
        assert res.status_code == 200

    def test_recent_activity(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/dashboard/recent-activity", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_overview(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/dashboard/overview", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "fleet_status" in data
        assert "stats" in data
        assert "alerts" in data
        assert "recent_activity" in data
