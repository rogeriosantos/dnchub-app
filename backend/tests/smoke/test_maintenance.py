"""Smoke tests for maintenance endpoints."""

from fastapi.testclient import TestClient


class TestMaintenanceSmoke:
    """Verify maintenance endpoints return expected status codes."""

    def test_list_maintenance_tasks_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/maintenance/tasks")
        assert res.status_code in (401, 403)

    def test_list_maintenance_tasks(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/maintenance/tasks", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_overdue_tasks(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/maintenance/tasks/overdue", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_upcoming_tasks(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/maintenance/tasks/upcoming", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_cost_summary_requires_dates(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/maintenance/tasks/cost-summary", headers=admin_headers)
        assert res.status_code == 422

    def test_create_maintenance_task_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post(
            "/api/v1/maintenance/tasks", json={}, headers=manager_headers
        )
        assert res.status_code == 422

    def test_get_maintenance_task_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/maintenance/tasks/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_maintenance_task_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/maintenance/tasks/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204

    # Maintenance Schedules
    def test_list_maintenance_schedules(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/maintenance/schedules", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_maintenance_schedule_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post(
            "/api/v1/maintenance/schedules", json={}, headers=manager_headers
        )
        assert res.status_code == 422

    def test_get_maintenance_schedule_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/maintenance/schedules/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_check_due_schedules(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/maintenance/schedules/due", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_delete_maintenance_schedule_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/maintenance/schedules/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204
