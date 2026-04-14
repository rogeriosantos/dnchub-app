"""Smoke tests for document endpoints."""

from fastapi.testclient import TestClient


class TestDocumentSmoke:
    """Verify document endpoints return expected status codes."""

    def test_list_documents_unauthorized(self, client: TestClient):
        res = client.get("/api/v1/documents")
        assert res.status_code in (401, 403)

    def test_list_documents(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/documents", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_expiring_documents(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/documents/expiring", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_expired_documents(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/documents/expired", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_document_summary(self, client: TestClient, admin_headers: dict):
        res = client.get("/api/v1/documents/summary", headers=admin_headers)
        assert res.status_code == 200

    def test_create_document_missing_fields_returns_422(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.post("/api/v1/documents", json={}, headers=manager_headers)
        assert res.status_code == 422

    def test_get_document_nonexistent_returns_404(
        self, client: TestClient, admin_headers: dict
    ):
        res = client.get(
            "/api/v1/documents/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert res.status_code == 404

    def test_update_document_nonexistent_returns_404(
        self, client: TestClient, manager_headers: dict
    ):
        res = client.patch(
            "/api/v1/documents/00000000-0000-0000-0000-000000000000",
            json={"title": "Updated"},
            headers=manager_headers,
        )
        assert res.status_code == 404

    def test_delete_document_nonexistent_returns_204(
        self, client: TestClient, manager_headers: dict
    ):
        """Soft-delete of nonexistent ID succeeds silently (returns 204)."""
        res = client.delete(
            "/api/v1/documents/00000000-0000-0000-0000-000000000000",
            headers=manager_headers,
        )
        assert res.status_code == 204
