"""Database seeding utilities."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.base import SessionLocal
from app.models import (
    CostCenter,
    Employee,
    FuelEntry,
    MaintenanceSchedule,
    MaintenanceTask,
    Organization,
    User,
    Vehicle,
    VehicleGroup,
)
from app.models.enums import (
    DistanceUnit,
    EmployeeStatus,
    FuelEfficiencyFormat,
    FuelType,
    IntervalType,
    MaintenancePriority,
    MaintenanceStatus,
    MaintenanceType,
    UserRole,
    VehicleStatus,
    VehicleType,
    VolumeUnit,
)


def seed_database():
    """Seed database with sample data."""
    db = SessionLocal()
    try:
        seed_organizations(db)
        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


def seed_organizations(db: Session):
    """Seed organizations and related data."""
    # Create organization
    org = Organization(
        name="FleetOptima Demo Company",
        timezone="America/New_York",
        currency="USD",
        distance_unit=DistanceUnit.MI,
        volume_unit=VolumeUnit.GAL,
        fuel_efficiency_format=FuelEfficiencyFormat.MPG,
        city="New York",
        country="USA",
    )
    db.add(org)
    db.flush()

    print(f"Created organization: {org.name}")

    # Create admin user
    admin = User(
        organization_id=org.id,
        email="admin@fleetoptima.demo",
        password_hash=get_password_hash("admin123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)

    # Create fleet manager
    fleet_manager = User(
        organization_id=org.id,
        email="manager@fleetoptima.demo",
        password_hash=get_password_hash("manager123"),
        first_name="Fleet",
        last_name="Manager",
        role=UserRole.FLEET_MANAGER,
        is_active=True,
    )
    db.add(fleet_manager)

    # Create operator
    operator = User(
        organization_id=org.id,
        email="operator@fleetoptima.demo",
        password_hash=get_password_hash("operator123"),
        first_name="John",
        last_name="Operator",
        role=UserRole.OPERATOR,
        is_active=True,
    )
    db.add(operator)

    db.flush()
    print("Created users: admin, fleet manager, operator")

    # Create cost centers
    cost_centers = [
        CostCenter(
            organization_id=org.id,
            code="OPS-001",
            name="Operations - North Region",
            description="North region operations fleet",
            budget=Decimal("50000.00"),
            is_active=True,
        ),
        CostCenter(
            organization_id=org.id,
            code="OPS-002",
            name="Operations - South Region",
            description="South region operations fleet",
            budget=Decimal("45000.00"),
            is_active=True,
        ),
        CostCenter(
            organization_id=org.id,
            code="EXEC-001",
            name="Executive Fleet",
            description="Executive transportation",
            budget=Decimal("30000.00"),
            is_active=True,
        ),
    ]
    for cc in cost_centers:
        db.add(cc)
    db.flush()
    print(f"Created {len(cost_centers)} cost centers")

    # Create vehicle group
    delivery_group = VehicleGroup(
        organization_id=org.id,
        name="Delivery Fleet",
        description="Vehicles used for delivery operations",
    )
    db.add(delivery_group)
    db.flush()

    # Create vehicles
    vehicles_data = [
        {
            "registration_plate": "ABC-1234",
            "vin": "1HGCM82633A123456",
            "make": "Ford",
            "model": "Transit",
            "year": 2022,
            "type": VehicleType.VAN,
            "fuel_type": FuelType.DIESEL,
            "status": VehicleStatus.ACTIVE,
            "current_odometer": Decimal("45000"),
            "fuel_capacity": Decimal("20"),
            "cost_center_id": cost_centers[0].id,
        },
        {
            "registration_plate": "DEF-5678",
            "vin": "1HGCM82633A654321",
            "make": "Toyota",
            "model": "Camry",
            "year": 2023,
            "type": VehicleType.SEDAN,
            "fuel_type": FuelType.HYBRID,
            "status": VehicleStatus.ACTIVE,
            "current_odometer": Decimal("12000"),
            "fuel_capacity": Decimal("13"),
            "cost_center_id": cost_centers[2].id,
        },
        {
            "registration_plate": "GHI-9012",
            "vin": "1HGCM82633A789012",
            "make": "Chevrolet",
            "model": "Silverado",
            "year": 2021,
            "type": VehicleType.TRUCK,
            "fuel_type": FuelType.GASOLINE,
            "status": VehicleStatus.ACTIVE,
            "current_odometer": Decimal("78000"),
            "fuel_capacity": Decimal("26"),
            "cost_center_id": cost_centers[1].id,
        },
        {
            "registration_plate": "JKL-3456",
            "vin": "1HGCM82633A345678",
            "make": "Mercedes-Benz",
            "model": "Sprinter",
            "year": 2022,
            "type": VehicleType.VAN,
            "fuel_type": FuelType.DIESEL,
            "status": VehicleStatus.IN_MAINTENANCE,
            "current_odometer": Decimal("62000"),
            "fuel_capacity": Decimal("22"),
            "cost_center_id": cost_centers[0].id,
        },
    ]

    vehicles = []
    for v_data in vehicles_data:
        vehicle = Vehicle(organization_id=org.id, **v_data)
        db.add(vehicle)
        vehicles.append(vehicle)
    db.flush()
    print(f"Created {len(vehicles)} vehicles")

    # Create employees
    employees_data = [
        {
            "employee_id": "EMP-001",
            "first_name": "Michael",
            "last_name": "Johnson",
            "email": "michael.johnson@fleetoptima.demo",
            "phone": "+1-555-0101",
            "status": EmployeeStatus.AVAILABLE,
            "license_number": "D1234567",
            "license_class": "CDL-A",
            "license_expiry": date.today() + timedelta(days=365),
            "hire_date": date.today() - timedelta(days=730),
            "pin_code": "1234",
        },
        {
            "employee_id": "EMP-002",
            "first_name": "Sarah",
            "last_name": "Williams",
            "email": "sarah.williams@fleetoptima.demo",
            "phone": "+1-555-0102",
            "status": EmployeeStatus.ON_DUTY,
            "license_number": "D7654321",
            "license_class": "CDL-B",
            "license_expiry": date.today() + timedelta(days=180),
            "hire_date": date.today() - timedelta(days=365),
            "pin_code": "5678",
        },
        {
            "employee_id": "EMP-003",
            "first_name": "Robert",
            "last_name": "Brown",
            "email": "robert.brown@fleetoptima.demo",
            "phone": "+1-555-0103",
            "status": EmployeeStatus.AVAILABLE,
            "license_number": "D9876543",
            "license_class": "CDL-A",
            "license_expiry": date.today() + timedelta(days=30),
            "hire_date": date.today() - timedelta(days=1095),
            "pin_code": "9012",
        },
    ]

    employees = []
    for e_data in employees_data:
        employee = Employee(organization_id=org.id, **e_data)
        db.add(employee)
        employees.append(employee)
    db.flush()
    print(f"Created {len(employees)} employees")

    # Assign employee to vehicle
    vehicles[0].assigned_employee_id = employees[1].id  # Sarah is on duty with Transit
    db.add(vehicles[0])
    db.flush()

    # Create fuel entries
    for i in range(5):
        entry_date = date.today() - timedelta(days=i * 7)
        fuel_entry = FuelEntry(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            employee_id=employees[1].id,
            cost_center_id=cost_centers[0].id,
            date=entry_date,
            odometer=Decimal(str(45000 - (i * 350))),
            volume=Decimal("15.5"),
            price_per_unit=Decimal("3.89"),
            total_cost=Decimal("60.30"),
            fuel_type=FuelType.DIESEL,
            full_tank=True,
            station="Shell Station #1234",
            distance=Decimal("350") if i > 0 else None,
            fuel_efficiency=Decimal("22.58") if i > 0 else None,
        )
        db.add(fuel_entry)
    db.flush()
    print("Created fuel entries")

    # Create maintenance tasks
    maintenance_tasks = [
        # Scheduled tasks
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.OIL_CHANGE,
            category="preventive",
            title="Oil Change - Regular Service",
            description="Regular oil change and filter replacement",
            scheduled_date=date.today() + timedelta(days=14),
            priority=MaintenancePriority.MEDIUM,
            status=MaintenanceStatus.SCHEDULED,
            estimated_cost=Decimal("75.00"),
            work_order_number="WO-2024-001",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[1].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.TIRE_ROTATION,
            category="preventive",
            title="Tire Rotation - Quarterly",
            description="Quarterly tire rotation and balance",
            scheduled_date=date.today() + timedelta(days=7),
            priority=MaintenancePriority.LOW,
            status=MaintenanceStatus.SCHEDULED,
            estimated_cost=Decimal("60.00"),
            work_order_number="WO-2024-002",
        ),
        # In-progress tasks
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[3].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.BRAKE_SERVICE,
            category="corrective",
            title="Brake Pad Replacement - Front Axle",
            description="Brake pad replacement - front axle showing wear",
            scheduled_date=date.today() - timedelta(days=2),
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.IN_PROGRESS,
            estimated_cost=Decimal("350.00"),
            assigned_to="John Mechanic",
            service_provider="FleetService Pro",
            work_order_number="WO-2024-003",
        ),
        # Completed tasks with full cost data
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[2].id,
            cost_center_id=cost_centers[1].id,
            type=MaintenanceType.TIRE_ROTATION,
            category="preventive",
            title="Tire Rotation and Inspection",
            description="Regular tire rotation with full inspection",
            scheduled_date=date.today() - timedelta(days=30),
            completed_date=date.today() - timedelta(days=28),
            priority=MaintenancePriority.LOW,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("50.00"),
            actual_cost=Decimal("45.00"),
            labor_cost=Decimal("25.00"),
            parts_cost=Decimal("20.00"),
            service_provider="QuickTire Service",
            assigned_to="Mike Tech",
            work_order_number="WO-2024-004",
            notes="All tires in good condition, rotated front to back",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.OIL_CHANGE,
            category="preventive",
            title="Oil Change - 50K Service",
            description="50,000 km service - oil change with synthetic oil",
            scheduled_date=date.today() - timedelta(days=45),
            completed_date=date.today() - timedelta(days=44),
            priority=MaintenancePriority.MEDIUM,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("85.00"),
            actual_cost=Decimal("92.50"),
            labor_cost=Decimal("35.00"),
            parts_cost=Decimal("57.50"),
            service_provider="FleetService Pro",
            assigned_to="John Mechanic",
            work_order_number="WO-2024-005",
            notes="Used premium synthetic oil as recommended",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[1].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.BRAKE_SERVICE,
            category="corrective",
            title="Brake Fluid Flush",
            description="Complete brake fluid flush and replacement",
            scheduled_date=date.today() - timedelta(days=60),
            completed_date=date.today() - timedelta(days=58),
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("120.00"),
            actual_cost=Decimal("115.00"),
            labor_cost=Decimal("65.00"),
            parts_cost=Decimal("50.00"),
            service_provider="FleetService Pro",
            assigned_to="Sarah Mechanic",
            work_order_number="WO-2024-006",
            notes="Replaced with DOT 4 brake fluid",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[3].id,
            cost_center_id=cost_centers[1].id,
            type=MaintenanceType.INSPECTION,
            category="inspection",
            title="Annual Safety Inspection",
            description="Comprehensive annual vehicle safety inspection",
            scheduled_date=date.today() - timedelta(days=90),
            completed_date=date.today() - timedelta(days=89),
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("150.00"),
            actual_cost=Decimal("150.00"),
            labor_cost=Decimal("150.00"),
            parts_cost=Decimal("0.00"),
            service_provider="State Inspection Center",
            work_order_number="WO-2024-007",
            notes="Passed all safety requirements",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[2].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.ENGINE_SERVICE,
            category="corrective",
            title="Air Filter Replacement",
            description="Engine air filter replacement due to restricted airflow",
            scheduled_date=date.today() - timedelta(days=120),
            completed_date=date.today() - timedelta(days=118),
            priority=MaintenancePriority.MEDIUM,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("45.00"),
            actual_cost=Decimal("42.00"),
            labor_cost=Decimal("15.00"),
            parts_cost=Decimal("27.00"),
            service_provider="AutoParts Plus",
            assigned_to="Mike Tech",
            work_order_number="WO-2024-008",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.TIRE_ROTATION,
            category="preventive",
            title="Tire Replacement - All Four",
            description="Full tire replacement - all four tires worn",
            scheduled_date=date.today() - timedelta(days=150),
            completed_date=date.today() - timedelta(days=148),
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("800.00"),
            actual_cost=Decimal("875.00"),
            labor_cost=Decimal("75.00"),
            parts_cost=Decimal("800.00"),
            service_provider="TireWorld",
            assigned_to="Tire Team",
            work_order_number="WO-2024-009",
            notes="Installed Michelin Defender LTX M/S tires",
        ),
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[1].id,
            cost_center_id=cost_centers[1].id,
            type=MaintenanceType.TRANSMISSION_SERVICE,
            category="corrective",
            title="Transmission Fluid Change",
            description="Automatic transmission fluid flush and filter replacement",
            scheduled_date=date.today() - timedelta(days=180),
            completed_date=date.today() - timedelta(days=179),
            priority=MaintenancePriority.MEDIUM,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("250.00"),
            actual_cost=Decimal("285.00"),
            labor_cost=Decimal("120.00"),
            parts_cost=Decimal("165.00"),
            service_provider="TransmissionPro",
            assigned_to="Expert Tech",
            work_order_number="WO-2024-010",
            notes="Used manufacturer recommended ATF",
        ),
        # Overdue task
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[2].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.OIL_CHANGE,
            category="preventive",
            title="Overdue Oil Change",
            description="Oil change overdue by 2 weeks",
            scheduled_date=date.today() - timedelta(days=14),
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.OVERDUE,
            estimated_cost=Decimal("75.00"),
            work_order_number="WO-2024-011",
        ),
        # Emergency repair
        MaintenanceTask(
            organization_id=org.id,
            vehicle_id=vehicles[3].id,
            cost_center_id=cost_centers[0].id,
            type=MaintenanceType.BRAKE_SERVICE,
            category="emergency",
            title="Emergency Brake Line Repair",
            description="Emergency brake line replacement after leak detected",
            scheduled_date=date.today() - timedelta(days=200),
            completed_date=date.today() - timedelta(days=200),
            priority=MaintenancePriority.CRITICAL,
            status=MaintenanceStatus.COMPLETED,
            estimated_cost=Decimal("400.00"),
            actual_cost=Decimal("475.00"),
            labor_cost=Decimal("200.00"),
            parts_cost=Decimal("275.00"),
            service_provider="24/7 Emergency Auto",
            assigned_to="Emergency Team",
            work_order_number="WO-2024-012",
            notes="Brake line corroded, replaced entire line assembly",
        ),
    ]
    for task in maintenance_tasks:
        db.add(task)
    db.flush()
    print(f"Created {len(maintenance_tasks)} maintenance tasks")

    # Create maintenance schedules
    schedules = [
        MaintenanceSchedule(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            task_name="Oil Change - Regular",
            interval_type=IntervalType.BOTH,
            interval_mileage=Decimal("8000"),
            interval_days=90,
            estimated_cost=Decimal("75.00"),
            is_active=True,
            next_due_date=date.today() + timedelta(days=30),
            next_due_odometer=Decimal("58000"),
        ),
        MaintenanceSchedule(
            organization_id=org.id,
            vehicle_id=vehicles[0].id,
            task_name="Tire Rotation",
            interval_type=IntervalType.MILEAGE,
            interval_mileage=Decimal("16000"),
            interval_days=180,
            estimated_cost=Decimal("50.00"),
            is_active=True,
            next_due_date=date.today() + timedelta(days=60),
            next_due_odometer=Decimal("66000"),
        ),
        MaintenanceSchedule(
            organization_id=org.id,
            vehicle_id=vehicles[1].id,
            task_name="Brake Inspection",
            interval_type=IntervalType.TIME,
            interval_days=365,
            estimated_cost=Decimal("100.00"),
            is_active=True,
            next_due_date=date.today() + timedelta(days=120),
        ),
        MaintenanceSchedule(
            organization_id=org.id,
            vehicle_id=vehicles[2].id,
            task_name="Air Filter Replacement",
            interval_type=IntervalType.MILEAGE,
            interval_mileage=Decimal("24000"),
            estimated_cost=Decimal("45.00"),
            is_active=True,
            next_due_odometer=Decimal("72000"),
        ),
    ]
    for schedule in schedules:
        db.add(schedule)
    db.flush()
    print(f"Created {len(schedules)} maintenance schedules")


def run_seed():
    """Run the seed script."""
    seed_database()


if __name__ == "__main__":
    run_seed()
