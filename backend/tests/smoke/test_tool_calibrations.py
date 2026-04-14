"""Smoke tests for tool calibration endpoints."""

from fastapi.testclient import TestClient


class TestToolCalibrationSmoke:
    """Verify tool calibration endpoints return expected status codes."""

    def test_list_calibrations_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/tool-calibrations")
        assert res.status_code in (401, 403)

    def test_list_calibrations(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/tool-calibrations", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_calibration_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post(
            "/api/v1/tool-calibrations", json={}, headers=manager_headers
        )
        assert res.status_code == 422

    def test_get_calibration_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/tool-calibrations/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404
