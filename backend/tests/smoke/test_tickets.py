"""Smoke tests for ticket endpoints."""

from fastapi.testclient import TestClient


class TestTicketSmoke:
    """Verify ticket endpoints return expected status codes."""

    def test_list_tickets_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/tickets")
        assert res.status_code in (401, 403)

    def test_list_tickets(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tickets", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_overdue_tickets(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tickets/overdue", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_ticket_stats(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tickets/stats", headers=admin_headers)
        assert res.status_code == 200

    def test_create_ticket_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post("/api/v1/tickets", json={}, headers=manager_headers)
        assert res.status_code == 422

    def test_get_ticket_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/tickets/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_update_ticket_nonexistent_returns_404(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.patch(
            "/api/v1/tickets/00000000-0000-0000-0000-000000000000",
            json={"notes": "Updated"},
            headers=manager_headers,
        )
        assert res.status_code == 404

    def test_delete_ticket_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/tickets/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204
