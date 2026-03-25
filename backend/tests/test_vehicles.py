"""Vehicle endpoint tests."""

from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Organization, Vehicle
from app.models.enums import FuelType, VehicleStatus, VehicleType


@pytest.mark.asyncio
async def test_list_vehicles_unauthorized(client: AsyncClient):
    """Test listing vehicles without authentication."""
    response = await client.get("/api/v1/vehicles")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_vehicles_empty(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict,
):
    """Test listing vehicles when empty."""
    response = await client.get("/api/v1/vehicles", headers=admin_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_vehicle(
    client: AsyncClient,
    db_session: AsyncSession,
    manager_headers: dict,
    test_organization: Organization,
):
    """Test creating a vehicle."""
    vehicle_data = {
        "registration_plate": "TEST-001",
        "vin": "1HGCM82633A123456",
        "make": "Toyota",
        "model": "Camry",
        "year": 2023,
        "type": "sedan",
        "fuel_type": "gasoline",
        "tank_capacity": 15.0,
    }
    response = await client.post(
        "/api/v1/vehicles",
        json=vehicle_data,
        headers=manager_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["registration_plate"] == "TEST-001"
    assert data["make"] == "Toyota"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_create_duplicate_vehicle(
    client: AsyncClient,
    db_session: AsyncSession,
    manager_headers: dict,
    test_organization: Organization,
):
    """Test creating a vehicle with duplicate plate."""
    # Create first vehicle
    vehicle = Vehicle(
        organization_id=test_organization.id,
        registration_plate="DUPE-001",
        make="Honda",
        model="Civic",
        year=2022,
        type=VehicleType.SEDAN,
        fuel_type=FuelType.GASOLINE,
        status=VehicleStatus.ACTIVE,
        current_odometer=Decimal("0"),
    )
    db_session.add(vehicle)
    await db_session.flush()

    # Try to create duplicate
    vehicle_data = {
        "registration_plate": "DUPE-001",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2023,
        "type": "sedan",
        "fuel_type": "gasoline",
    }
    response = await client.post(
        "/api/v1/vehicles",
        json=vehicle_data,
        headers=manager_headers,
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_get_vehicle(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_headers: dict,
    test_organization: Organization,
):
    """Test getting a single vehicle."""
    # Create vehicle
    vehicle = Vehicle(
        organization_id=test_organization.id,
        registration_plate="GET-001",
        make="Ford",
        model="Focus",
        year=2021,
        type=VehicleType.SEDAN,
        fuel_type=FuelType.GASOLINE,
        status=VehicleStatus.ACTIVE,
        current_odometer=Decimal("50000"),
    )
    db_session.add(vehicle)
    await db_session.flush()
    await db_session.refresh(vehicle)

    response = await client.get(
        f"/api/v1/vehicles/{vehicle.id}",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["registration_plate"] == "GET-001"


@pytest.mark.asyncio
async def test_update_vehicle(
    client: AsyncClient,
    db_session: AsyncSession,
    manager_headers: dict,
    test_organization: Organization,
):
    """Test updating a vehicle."""
    # Create vehicle
    vehicle = Vehicle(
        organization_id=test_organization.id,
        registration_plate="UPD-001",
        make="Chevrolet",
        model="Malibu",
        year=2020,
        type=VehicleType.SEDAN,
        fuel_type=FuelType.GASOLINE,
        status=VehicleStatus.ACTIVE,
        current_odometer=Decimal("30000"),
    )
    db_session.add(vehicle)
    await db_session.flush()
    await db_session.refresh(vehicle)

    response = await client.patch(
        f"/api/v1/vehicles/{vehicle.id}",
        json={"status": "in_maintenance"},
        headers=manager_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_maintenance"


@pytest.mark.asyncio
async def test_delete_vehicle(
    client: AsyncClient,
    db_session: AsyncSession,
    manager_headers: dict,
    test_organization: Organization,
):
    """Test deleting a vehicle."""
    # Create vehicle
    vehicle = Vehicle(
        organization_id=test_organization.id,
        registration_plate="DEL-001",
        make="Nissan",
        model="Altima",
        year=2019,
        type=VehicleType.SEDAN,
        fuel_type=FuelType.GASOLINE,
        status=VehicleStatus.ACTIVE,
        current_odometer=Decimal("80000"),
    )
    db_session.add(vehicle)
    await db_session.flush()
    await db_session.refresh(vehicle)

    response = await client.delete(
        f"/api/v1/vehicles/{vehicle.id}",
        headers=manager_headers,
    )
    assert response.status_code == 204
