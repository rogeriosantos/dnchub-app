"""Vehicle endpoint tests."""

from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Organization, Vehicle
from app.models.enums import FuelType, VehicleStatus, VehicleType


def test_list_vehicles_unauthorized(client: TestClient):
    """Test listing vehicles without authentication."""
    response = client.get("/api/v1/vehicles")
    assert response.status_code in (401, 403)


def test_list_vehicles_empty(
    client: TestClient,
    db_session: Session,
    admin_headers: dict,
):
    """Test listing vehicles when empty."""
    response = client.get("/api/v1/vehicles", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_vehicle(
    client: TestClient,
    db_session: Session,
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
    response = client.post(
        "/api/v1/vehicles",
        json=vehicle_data,
        headers=manager_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["registration_plate"] == "TEST-001"
    assert data["make"] == "Toyota"
    assert data["status"] == "active"


def test_create_vehicle_missing_fields_returns_422(
    client: TestClient,
    manager_headers: dict,
):
    """Test creating a vehicle with missing required fields returns 422."""
    response = client.post(
        "/api/v1/vehicles",
        json={},
        headers=manager_headers,
    )
    assert response.status_code == 422


def test_create_duplicate_vehicle(
    client: TestClient,
    db_session: Session,
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
    db_session.flush()

    # Try to create duplicate
    vehicle_data = {
        "registration_plate": "DUPE-001",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2023,
        "type": "sedan",
        "fuel_type": "gasoline",
    }
    response = client.post(
        "/api/v1/vehicles",
        json=vehicle_data,
        headers=manager_headers,
    )
    assert response.status_code == 409


def test_get_vehicle(
    client: TestClient,
    db_session: Session,
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
    db_session.flush()
    db_session.refresh(vehicle)

    response = client.get(
        f"/api/v1/vehicles/{vehicle.id}",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["registration_plate"] == "GET-001"


def test_get_vehicle_nonexistent_returns_404(
    client: TestClient,
    admin_headers: dict,
):
    """Test getting a nonexistent vehicle returns 404."""
    response = client.get(
        "/api/v1/vehicles/00000000-0000-0000-0000-000000000000",
        headers=admin_headers,
    )
    assert response.status_code == 404


def test_update_vehicle(
    client: TestClient,
    db_session: Session,
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
    db_session.flush()
    db_session.refresh(vehicle)

    response = client.patch(
        f"/api/v1/vehicles/{vehicle.id}",
        json={"status": "in_maintenance"},
        headers=manager_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_maintenance"


def test_delete_vehicle(
    client: TestClient,
    db_session: Session,
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
    db_session.flush()
    db_session.refresh(vehicle)

    response = client.delete(
        f"/api/v1/vehicles/{vehicle.id}",
        headers=manager_headers,
    )
    assert response.status_code == 204
