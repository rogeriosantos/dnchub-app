"""Fix all enum values to lowercase

Revision ID: dad97592d91c
Revises: 0d964f7dc85d
Create Date: 2025-12-14 12:19:34.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'dad97592d91c'
down_revision: Union[str, None] = '0d964f7dc85d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def rename_enum_value_if_exists(enum_name: str, old_value: str, new_value: str) -> str:
    """Generate SQL to safely rename enum value only if it exists."""
    return f"""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = '{enum_name}' AND e.enumlabel = '{old_value}'
        ) THEN
            ALTER TYPE {enum_name} RENAME VALUE '{old_value}' TO '{new_value}';
        END IF;
    END $$;
    """


def upgrade() -> None:
    # UserRole enum
    op.execute(rename_enum_value_if_exists('userrole', 'ADMIN', 'admin'))
    op.execute(rename_enum_value_if_exists('userrole', 'FLEET_MANAGER', 'fleet_manager'))
    op.execute(rename_enum_value_if_exists('userrole', 'OPERATOR', 'operator'))
    op.execute(rename_enum_value_if_exists('userrole', 'VIEWER', 'viewer'))
    op.execute(rename_enum_value_if_exists('userrole', 'DRIVER', 'driver'))

    # VehicleStatus enum
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'ACTIVE', 'active'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'IN_MAINTENANCE', 'in_maintenance'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'INACTIVE', 'inactive'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'OUT_OF_SERVICE', 'out_of_service'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'IN_TRANSIT', 'in_transit'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'IDLE', 'idle'))

    # VehicleType enum
    op.execute(rename_enum_value_if_exists('vehicletype', 'SEDAN', 'sedan'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'SUV', 'suv'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'TRUCK', 'truck'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'VAN', 'van'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'PICKUP', 'pickup'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'MOTORCYCLE', 'motorcycle'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'BUS', 'bus'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'HEAVY_TRUCK', 'heavy_truck'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'TRAILER', 'trailer'))

    # DriverStatus enum
    op.execute(rename_enum_value_if_exists('driverstatus', 'AVAILABLE', 'available'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'ON_DUTY', 'on_duty'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'OFF_DUTY', 'off_duty'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'ON_LEAVE', 'on_leave'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'SUSPENDED', 'suspended'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'ON_BREAK', 'on_break'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'ON_TRIP', 'on_trip'))

    # DistanceUnit enum
    op.execute(rename_enum_value_if_exists('distanceunit', 'KM', 'km'))
    op.execute(rename_enum_value_if_exists('distanceunit', 'MI', 'mi'))

    # VolumeUnit enum
    op.execute(rename_enum_value_if_exists('volumeunit', 'L', 'l'))
    op.execute(rename_enum_value_if_exists('volumeunit', 'GAL', 'gal'))

    # FuelEfficiencyFormat enum
    op.execute(rename_enum_value_if_exists('fuelefficiencyformat', 'KM_PER_L', 'km/l'))
    op.execute(rename_enum_value_if_exists('fuelefficiencyformat', 'L_PER_100KM', 'l/100km'))
    op.execute(rename_enum_value_if_exists('fuelefficiencyformat', 'MPG', 'mpg'))

    # MaintenanceStatus enum
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'SCHEDULED', 'scheduled'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'IN_PROGRESS', 'in_progress'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'COMPLETED', 'completed'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'OVERDUE', 'overdue'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'CANCELLED', 'cancelled'))

    # MaintenancePriority enum
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'LOW', 'low'))
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'MEDIUM', 'medium'))
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'HIGH', 'high'))
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'CRITICAL', 'critical'))

    # MaintenanceType enum
    op.execute(rename_enum_value_if_exists('maintenancetype', 'PREVENTIVE', 'preventive'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'CORRECTIVE', 'corrective'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'INSPECTION', 'inspection'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'RECALL', 'recall'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'EMERGENCY', 'emergency'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'OIL_CHANGE', 'oil_change'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'TIRE_ROTATION', 'tire_rotation'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'BRAKE_SERVICE', 'brake_service'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'ENGINE_SERVICE', 'engine_service'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'TRANSMISSION_SERVICE', 'transmission_service'))

    # IntervalType enum
    op.execute(rename_enum_value_if_exists('intervaltype', 'MILEAGE', 'mileage'))
    op.execute(rename_enum_value_if_exists('intervaltype', 'TIME', 'time'))
    op.execute(rename_enum_value_if_exists('intervaltype', 'BOTH', 'both'))

    # DocumentStatus enum
    op.execute(rename_enum_value_if_exists('documentstatus', 'VALID', 'valid'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'EXPIRING_SOON', 'expiring_soon'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'EXPIRED', 'expired'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'PENDING', 'pending'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'REJECTED', 'rejected'))

    # EntityType enum
    op.execute(rename_enum_value_if_exists('entitytype', 'VEHICLE', 'vehicle'))
    op.execute(rename_enum_value_if_exists('entitytype', 'DRIVER', 'driver'))
    op.execute(rename_enum_value_if_exists('entitytype', 'ORGANIZATION', 'organization'))

    # BudgetPeriod enum
    op.execute(rename_enum_value_if_exists('budgetperiod', 'MONTHLY', 'monthly'))
    op.execute(rename_enum_value_if_exists('budgetperiod', 'QUARTERLY', 'quarterly'))
    op.execute(rename_enum_value_if_exists('budgetperiod', 'YEARLY', 'yearly'))

    # SourceType enum
    op.execute(rename_enum_value_if_exists('sourcetype', 'FUEL', 'fuel'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'MAINTENANCE', 'maintenance'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'INSURANCE', 'insurance'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'REGISTRATION', 'registration'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'OTHER', 'other'))

    # GeofenceType enum
    op.execute(rename_enum_value_if_exists('geofencetype', 'CIRCLE', 'circle'))
    op.execute(rename_enum_value_if_exists('geofencetype', 'POLYGON', 'polygon'))

    # AlertType enum
    op.execute(rename_enum_value_if_exists('alerttype', 'SPEEDING', 'speeding'))
    op.execute(rename_enum_value_if_exists('alerttype', 'GEOFENCE_ENTRY', 'geofence_entry'))
    op.execute(rename_enum_value_if_exists('alerttype', 'GEOFENCE_EXIT', 'geofence_exit'))
    op.execute(rename_enum_value_if_exists('alerttype', 'HARSH_BRAKING', 'harsh_braking'))
    op.execute(rename_enum_value_if_exists('alerttype', 'HARSH_ACCELERATION', 'harsh_acceleration'))
    op.execute(rename_enum_value_if_exists('alerttype', 'IDLE', 'idle'))

    # AlertSeverity enum
    op.execute(rename_enum_value_if_exists('alertseverity', 'LOW', 'low'))
    op.execute(rename_enum_value_if_exists('alertseverity', 'MEDIUM', 'medium'))
    op.execute(rename_enum_value_if_exists('alertseverity', 'HIGH', 'high'))
    op.execute(rename_enum_value_if_exists('alertseverity', 'CRITICAL', 'critical'))

    # NotificationType enum
    op.execute(rename_enum_value_if_exists('notificationtype', 'INFO', 'info'))
    op.execute(rename_enum_value_if_exists('notificationtype', 'WARNING', 'warning'))
    op.execute(rename_enum_value_if_exists('notificationtype', 'ERROR', 'error'))
    op.execute(rename_enum_value_if_exists('notificationtype', 'SUCCESS', 'success'))

    # TripStatus enum
    op.execute(rename_enum_value_if_exists('tripstatus', 'SCHEDULED', 'scheduled'))
    op.execute(rename_enum_value_if_exists('tripstatus', 'IN_PROGRESS', 'in_progress'))
    op.execute(rename_enum_value_if_exists('tripstatus', 'COMPLETED', 'completed'))
    op.execute(rename_enum_value_if_exists('tripstatus', 'CANCELLED', 'cancelled'))

    # TicketType enum
    op.execute(rename_enum_value_if_exists('tickettype', 'SPEED', 'speed'))
    op.execute(rename_enum_value_if_exists('tickettype', 'PARKING', 'parking'))
    op.execute(rename_enum_value_if_exists('tickettype', 'TOLL', 'toll'))
    op.execute(rename_enum_value_if_exists('tickettype', 'RED_LIGHT', 'red_light'))
    op.execute(rename_enum_value_if_exists('tickettype', 'OTHER', 'other'))

    # TicketStatus enum
    op.execute(rename_enum_value_if_exists('ticketstatus', 'PENDING', 'pending'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'PAID', 'paid'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'APPEALED', 'appealed'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'CANCELLED', 'cancelled'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'OVERDUE', 'overdue'))

    # PaymentMethod enum
    op.execute(rename_enum_value_if_exists('paymentmethod', 'CASH', 'cash'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'CREDIT_CARD', 'credit_card'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'DEBIT_CARD', 'debit_card'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'BANK_TRANSFER', 'bank_transfer'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'CHECK', 'check'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'OTHER', 'other'))

    # PumpStatus enum
    op.execute(rename_enum_value_if_exists('pumpstatus', 'ACTIVE', 'active'))
    op.execute(rename_enum_value_if_exists('pumpstatus', 'INACTIVE', 'inactive'))
    op.execute(rename_enum_value_if_exists('pumpstatus', 'MAINTENANCE', 'maintenance'))
    op.execute(rename_enum_value_if_exists('pumpstatus', 'OUT_OF_SERVICE', 'out_of_service'))


def downgrade() -> None:
    # UserRole enum
    op.execute(rename_enum_value_if_exists('userrole', 'admin', 'ADMIN'))
    op.execute(rename_enum_value_if_exists('userrole', 'fleet_manager', 'FLEET_MANAGER'))
    op.execute(rename_enum_value_if_exists('userrole', 'operator', 'OPERATOR'))
    op.execute(rename_enum_value_if_exists('userrole', 'viewer', 'VIEWER'))
    op.execute(rename_enum_value_if_exists('userrole', 'driver', 'DRIVER'))

    # VehicleStatus enum
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'active', 'ACTIVE'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'in_maintenance', 'IN_MAINTENANCE'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'inactive', 'INACTIVE'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'out_of_service', 'OUT_OF_SERVICE'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'in_transit', 'IN_TRANSIT'))
    op.execute(rename_enum_value_if_exists('vehiclestatus', 'idle', 'IDLE'))

    # VehicleType enum
    op.execute(rename_enum_value_if_exists('vehicletype', 'sedan', 'SEDAN'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'suv', 'SUV'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'truck', 'TRUCK'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'van', 'VAN'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'pickup', 'PICKUP'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'motorcycle', 'MOTORCYCLE'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'bus', 'BUS'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'heavy_truck', 'HEAVY_TRUCK'))
    op.execute(rename_enum_value_if_exists('vehicletype', 'trailer', 'TRAILER'))

    # DriverStatus enum
    op.execute(rename_enum_value_if_exists('driverstatus', 'available', 'AVAILABLE'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'on_duty', 'ON_DUTY'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'off_duty', 'OFF_DUTY'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'on_leave', 'ON_LEAVE'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'suspended', 'SUSPENDED'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'on_break', 'ON_BREAK'))
    op.execute(rename_enum_value_if_exists('driverstatus', 'on_trip', 'ON_TRIP'))

    # DistanceUnit enum
    op.execute(rename_enum_value_if_exists('distanceunit', 'km', 'KM'))
    op.execute(rename_enum_value_if_exists('distanceunit', 'mi', 'MI'))

    # VolumeUnit enum
    op.execute(rename_enum_value_if_exists('volumeunit', 'l', 'L'))
    op.execute(rename_enum_value_if_exists('volumeunit', 'gal', 'GAL'))

    # FuelEfficiencyFormat enum
    op.execute(rename_enum_value_if_exists('fuelefficiencyformat', 'km/l', 'KM_PER_L'))
    op.execute(rename_enum_value_if_exists('fuelefficiencyformat', 'l/100km', 'L_PER_100KM'))
    op.execute(rename_enum_value_if_exists('fuelefficiencyformat', 'mpg', 'MPG'))

    # MaintenanceStatus enum
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'scheduled', 'SCHEDULED'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'in_progress', 'IN_PROGRESS'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'completed', 'COMPLETED'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'overdue', 'OVERDUE'))
    op.execute(rename_enum_value_if_exists('maintenancestatus', 'cancelled', 'CANCELLED'))

    # MaintenancePriority enum
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'low', 'LOW'))
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'medium', 'MEDIUM'))
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'high', 'HIGH'))
    op.execute(rename_enum_value_if_exists('maintenancepriority', 'critical', 'CRITICAL'))

    # MaintenanceType enum
    op.execute(rename_enum_value_if_exists('maintenancetype', 'preventive', 'PREVENTIVE'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'corrective', 'CORRECTIVE'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'inspection', 'INSPECTION'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'recall', 'RECALL'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'emergency', 'EMERGENCY'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'oil_change', 'OIL_CHANGE'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'tire_rotation', 'TIRE_ROTATION'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'brake_service', 'BRAKE_SERVICE'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'engine_service', 'ENGINE_SERVICE'))
    op.execute(rename_enum_value_if_exists('maintenancetype', 'transmission_service', 'TRANSMISSION_SERVICE'))

    # IntervalType enum
    op.execute(rename_enum_value_if_exists('intervaltype', 'mileage', 'MILEAGE'))
    op.execute(rename_enum_value_if_exists('intervaltype', 'time', 'TIME'))
    op.execute(rename_enum_value_if_exists('intervaltype', 'both', 'BOTH'))

    # DocumentStatus enum
    op.execute(rename_enum_value_if_exists('documentstatus', 'valid', 'VALID'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'expiring_soon', 'EXPIRING_SOON'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'expired', 'EXPIRED'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'pending', 'PENDING'))
    op.execute(rename_enum_value_if_exists('documentstatus', 'rejected', 'REJECTED'))

    # EntityType enum
    op.execute(rename_enum_value_if_exists('entitytype', 'vehicle', 'VEHICLE'))
    op.execute(rename_enum_value_if_exists('entitytype', 'driver', 'DRIVER'))
    op.execute(rename_enum_value_if_exists('entitytype', 'organization', 'ORGANIZATION'))

    # BudgetPeriod enum
    op.execute(rename_enum_value_if_exists('budgetperiod', 'monthly', 'MONTHLY'))
    op.execute(rename_enum_value_if_exists('budgetperiod', 'quarterly', 'QUARTERLY'))
    op.execute(rename_enum_value_if_exists('budgetperiod', 'yearly', 'YEARLY'))

    # SourceType enum
    op.execute(rename_enum_value_if_exists('sourcetype', 'fuel', 'FUEL'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'maintenance', 'MAINTENANCE'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'insurance', 'INSURANCE'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'registration', 'REGISTRATION'))
    op.execute(rename_enum_value_if_exists('sourcetype', 'other', 'OTHER'))

    # GeofenceType enum
    op.execute(rename_enum_value_if_exists('geofencetype', 'circle', 'CIRCLE'))
    op.execute(rename_enum_value_if_exists('geofencetype', 'polygon', 'POLYGON'))

    # AlertType enum
    op.execute(rename_enum_value_if_exists('alerttype', 'speeding', 'SPEEDING'))
    op.execute(rename_enum_value_if_exists('alerttype', 'geofence_entry', 'GEOFENCE_ENTRY'))
    op.execute(rename_enum_value_if_exists('alerttype', 'geofence_exit', 'GEOFENCE_EXIT'))
    op.execute(rename_enum_value_if_exists('alerttype', 'harsh_braking', 'HARSH_BRAKING'))
    op.execute(rename_enum_value_if_exists('alerttype', 'harsh_acceleration', 'HARSH_ACCELERATION'))
    op.execute(rename_enum_value_if_exists('alerttype', 'idle', 'IDLE'))

    # AlertSeverity enum
    op.execute(rename_enum_value_if_exists('alertseverity', 'low', 'LOW'))
    op.execute(rename_enum_value_if_exists('alertseverity', 'medium', 'MEDIUM'))
    op.execute(rename_enum_value_if_exists('alertseverity', 'high', 'HIGH'))
    op.execute(rename_enum_value_if_exists('alertseverity', 'critical', 'CRITICAL'))

    # NotificationType enum
    op.execute(rename_enum_value_if_exists('notificationtype', 'info', 'INFO'))
    op.execute(rename_enum_value_if_exists('notificationtype', 'warning', 'WARNING'))
    op.execute(rename_enum_value_if_exists('notificationtype', 'error', 'ERROR'))
    op.execute(rename_enum_value_if_exists('notificationtype', 'success', 'SUCCESS'))

    # TripStatus enum
    op.execute(rename_enum_value_if_exists('tripstatus', 'scheduled', 'SCHEDULED'))
    op.execute(rename_enum_value_if_exists('tripstatus', 'in_progress', 'IN_PROGRESS'))
    op.execute(rename_enum_value_if_exists('tripstatus', 'completed', 'COMPLETED'))
    op.execute(rename_enum_value_if_exists('tripstatus', 'cancelled', 'CANCELLED'))

    # TicketType enum
    op.execute(rename_enum_value_if_exists('tickettype', 'speed', 'SPEED'))
    op.execute(rename_enum_value_if_exists('tickettype', 'parking', 'PARKING'))
    op.execute(rename_enum_value_if_exists('tickettype', 'toll', 'TOLL'))
    op.execute(rename_enum_value_if_exists('tickettype', 'red_light', 'RED_LIGHT'))
    op.execute(rename_enum_value_if_exists('tickettype', 'other', 'OTHER'))

    # TicketStatus enum
    op.execute(rename_enum_value_if_exists('ticketstatus', 'pending', 'PENDING'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'paid', 'PAID'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'appealed', 'APPEALED'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'cancelled', 'CANCELLED'))
    op.execute(rename_enum_value_if_exists('ticketstatus', 'overdue', 'OVERDUE'))

    # PaymentMethod enum
    op.execute(rename_enum_value_if_exists('paymentmethod', 'cash', 'CASH'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'credit_card', 'CREDIT_CARD'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'debit_card', 'DEBIT_CARD'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'bank_transfer', 'BANK_TRANSFER'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'check', 'CHECK'))
    op.execute(rename_enum_value_if_exists('paymentmethod', 'other', 'OTHER'))

    # PumpStatus enum
    op.execute(rename_enum_value_if_exists('pumpstatus', 'active', 'ACTIVE'))
    op.execute(rename_enum_value_if_exists('pumpstatus', 'inactive', 'INACTIVE'))
    op.execute(rename_enum_value_if_exists('pumpstatus', 'maintenance', 'MAINTENANCE'))
    op.execute(rename_enum_value_if_exists('pumpstatus', 'out_of_service', 'OUT_OF_SERVICE'))
