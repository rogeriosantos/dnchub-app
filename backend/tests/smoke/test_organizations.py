"""Smoke tests for organization endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.models import Organization


class TestOrganizationSmoke:
    """Verify organization endpoints return expected status codes."""

    def test_list_organizations_unauthorized(self, client: TestClient):
        """Unauthenticated request returns 401/403."""
        res = client.get("/api/v1/organizations")
        assert res.status_code in (401, 403)

    @pytest.mark.xfail(
        reason="APP BUG: OrganizationService.get_active_organizations references "
        "Organization.is_active which does not exist on the model",
        strict=True,
    )
    def test_list_organizations_as_admin(self, client: TestClient, admin_headers: dict):
        """Admin can list organizations. Known bug: 500 due to missing is_active column."""
        res = client.get("/api/v1/organizations", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_get_current_organization(
        self, client: TestClient, admin_headers: dict, test_organization: Organization
    ):
        """GET /organizations/me returns current user org."""
        res = client.get("/api/v1/organizations/me", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Test Organization"

    def test_get_organization_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        """GET /organizations/{id} with nonexistent id returns 404."""
        res = client.get(
            "/api/v1/organizations/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_create_organization_missing_fields_returns_422(
        self, client: TestClient, admin_headers: dict
    ):
        """POST /organizations with empty body returns 422."""
        res = client.post("/api/v1/organizations", json={}, headers=admin_headers)
        assert res.status_code == 422

    @pytest.mark.xfail(
        reason="APP BUG: OrganizationService.create references obj_in.slug "
        "which does not exist on OrganizationCreate schema",
        strict=True,
    )
    def test_create_organization(self, client: TestClient, admin_headers: dict):
        """POST /organizations creates new org. Known bug: 500 due to missing slug."""
        res = client.post(
            "/api/v1/organizations",
            json={"name": "New Test Org"},
            headers=admin_headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "New Test Org"
        assert "id" in data

    def test_update_organization_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        """PATCH /organizations/{id} with nonexistent id returns 404."""
        res = client.patch(
            "/api/v1/organizations/00000000-0000-0000-0000-000000000000",
            json={"name": "Updated"},
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_delete_organization_nonexistent_returns_204(
        self, client: TestClient, admin_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/organizations/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 204
