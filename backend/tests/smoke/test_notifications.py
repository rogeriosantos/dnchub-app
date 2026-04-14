"""Smoke tests for notification endpoints."""

from fastapi.testclient import TestClient


class TestNotificationSmoke:
    """Verify notification endpoints return expected status codes."""

    def test_list_notifications_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/notifications")
        assert res.status_code in (401, 403)

    def test_list_notifications(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/notifications", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_unread_count(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/notifications/unread-count", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)

    def test_high_priority_notifications(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/notifications/high-priority", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_get_notification_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/notifications/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_mark_all_as_read(self, client: TestClient, admin_headers: dict):
        res = client.post("/api/v1/notifications/mark-all-read", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "marked_count" in data
