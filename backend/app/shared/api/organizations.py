"""Organization endpoints."""

from fastapi import APIRouter

from app.shared.api.deps import AdminUserDep, CurrentUserDep, DBDep
from app.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services import organization_service

router = APIRouter()


@router.get("", response_model=list[OrganizationResponse])
def list_organizations(
    db: DBDep,
    current_user: AdminUserDep,
    skip: int = 0,
    limit: int = 100,
) -> list[OrganizationResponse]:
    """List all organizations (admin only)."""
    organizations = organization_service.get_active_organizations(
        db, skip=skip, limit=limit
    )
    return [OrganizationResponse.model_validate(org) for org in organizations]


@router.post("", response_model=OrganizationResponse, status_code=201)
def create_organization(
    organization_in: OrganizationCreate,
    db: DBDep,
    current_user: AdminUserDep,
) -> OrganizationResponse:
    """Create a new organization (admin only)."""
    organization = organization_service.create(db, obj_in=organization_in)
    return OrganizationResponse.model_validate(organization)


@router.get("/me", response_model=OrganizationResponse)
def get_current_organization(
    db: DBDep,
    current_user: CurrentUserDep,
) -> OrganizationResponse:
    """Get the current user's organization."""
    organization = organization_service.get_or_404(
        db, current_user.organization_id
    )
    return OrganizationResponse.model_validate(organization)


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(
    organization_id: str,
    db: DBDep,
    current_user: AdminUserDep,
) -> OrganizationResponse:
    """Get an organization by ID (admin only)."""
    organization = organization_service.get_or_404(db, organization_id)
    return OrganizationResponse.model_validate(organization)


@router.patch("/{organization_id}", response_model=OrganizationResponse)
def update_organization(
    organization_id: str,
    organization_in: OrganizationUpdate,
    db: DBDep,
    current_user: AdminUserDep,
) -> OrganizationResponse:
    """Update an organization (admin only)."""
    organization = organization_service.get_or_404(db, organization_id)
    updated = organization_service.update(
        db, db_obj=organization, obj_in=organization_in
    )
    return OrganizationResponse.model_validate(updated)


@router.delete("/{organization_id}", status_code=204)
def delete_organization(
    organization_id: str,
    db: DBDep,
    current_user: AdminUserDep,
) -> None:
    """Delete an organization (admin only)."""
    organization_service.delete(db, organization_id)


@router.post("/{organization_id}/deactivate", response_model=OrganizationResponse)
def deactivate_organization(
    organization_id: str,
    db: DBDep,
    current_user: AdminUserDep,
) -> OrganizationResponse:
    """Deactivate an organization (admin only)."""
    organization = organization_service.get_or_404(db, organization_id)
    updated = organization_service.deactivate(db, organization)
    return OrganizationResponse.model_validate(updated)


@router.post("/{organization_id}/activate", response_model=OrganizationResponse)
def activate_organization(
    organization_id: str,
    db: DBDep,
    current_user: AdminUserDep,
) -> OrganizationResponse:
    """Activate an organization (admin only)."""
    organization = organization_service.get_or_404(db, organization_id)
    updated = organization_service.activate(db, organization)
    return OrganizationResponse.model_validate(updated)
