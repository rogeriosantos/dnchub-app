"""Smoke tests for notification preferences endpoints."""

from fastapi.testclient import TestClient


class TestNotificationPreferencesSmoke:
    """Verify notification preferences endpoints return expected status codes."""

    def test_get_preferences_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/notification-preferences")
        assert res.status_code in (401, 403)

    def test_get_preferences(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/notification-preferences", headers=admin_headers)
        assert res.status_code == 200

    def test_reset_to_defaults(self, client: TestClient, admin_headers: dict):
        res = client.post(
            "/api/v1/notification-preferences/reset",
            headers=admin_headers,
        )
        assert res.status_code == 200
