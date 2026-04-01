/**
 * Transform API responses (snake_case) to frontend types (camelCase)
 */

import type { Vehicle, Driver, DashboardMetrics, User, FuelEntry, FuelAnalytics, MaintenanceTask, MaintenanceSchedule, CostCenter, Ticket, TicketStats, FuelPump, FuelPumpDelivery, FuelPumpStats, FuelPumpDeliverySummary, Organization, Notification, NotificationPreferences, Trip, ToolCategory, ToolLocation, ToolCase, Tool, ToolAssignment, ToolCalibration, Consumable } from "@/types";
import type {
  VehicleApiResponse,
  DriverApiResponse,
  DashboardStatsResponse,
  UserApiResponse,
  FuelEntryApiResponse,
  FuelAnalyticsApiResponse,
  MaintenanceTaskApiResponse,
  MaintenanceScheduleApiResponse,
  CostCenterApiResponse,
  TicketApiResponse,
  TicketStatsApiResponse,
  FuelPumpApiResponse,
  FuelPumpDeliveryApiResponse,
  FuelPumpStatsResponse,
  FuelPumpDeliverySummaryResponse,
  OrganizationApiResponse,
  NotificationApiResponse,
  NotificationPreferencesApiResponse,
  TripApiResponse,
  ToolCategoryResponse,
  ToolLocationResponse,
  ToolCaseResponse,
  ToolResponse,
  ToolAssignmentResponse,
  ToolCalibrationResponse,
  ConsumableResponse,
} from "./types";

// Vehicle transformers
export function transformVehicle(api: VehicleApiResponse): Vehicle {
  return {
    id: api.id,
    organizationId: api.organization_id,
    registrationPlate: api.registration_plate,
    vin: api.vin ?? undefined,
    make: api.make,
    model: api.model,
    year: api.year,
    type: api.type as Vehicle["type"],
    fuelType: api.fuel_type as Vehicle["fuelType"],
    status: api.status as Vehicle["status"],
    color: api.color ?? undefined,
    currentOdometer: api.current_odometer,
    fuelCapacity: api.fuel_capacity ?? undefined,
    assignedDriverId: api.assigned_employee_id ?? undefined,
    costCenterId: api.cost_center_id ?? undefined,
    image: api.image ?? undefined,
    insuranceExpiry: api.insurance_expiry ?? undefined,
    insuranceProvider: api.insurance_provider ?? undefined,
    insurancePolicyNumber: api.insurance_policy_number ?? undefined,
    registrationExpiry: api.registration_expiry ?? undefined,
    lastServiceDate: api.last_service_date ?? undefined,
    nextServiceDate: api.next_service_date ?? undefined,
    nextServiceOdometer: api.next_service_odometer ?? undefined,
    notes: api.notes ?? undefined,
    averageFuelEfficiency: api.average_fuel_efficiency ?? undefined,
    totalFuelCost: api.total_fuel_cost ?? undefined,
    totalMaintenanceCost: api.total_maintenance_cost ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformVehicles(apiList: VehicleApiResponse[]): Vehicle[] {
  return apiList.map(transformVehicle);
}

// Driver transformers
export function transformDriver(api: DriverApiResponse): Driver {
  return {
    id: api.id,
    organizationId: api.organization_id,
    employeeId: api.employee_id,
    firstName: api.first_name,
    lastName: api.last_name,
    email: api.email,
    phone: api.phone,
    avatar: api.avatar ?? undefined,
    status: api.status as Driver["status"],
    licenseNumber: api.license_number,
    licenseClass: api.license_class,
    licenseIssueDate: api.license_issue_date ?? undefined,
    licenseExpiry: api.license_expiry,
    dateOfBirth: api.date_of_birth ?? undefined,
    hireDate: api.hire_date,
    address: api.address ?? undefined,
    emergencyContact: api.emergency_contact ?? undefined,
    emergencyPhone: api.emergency_phone ?? undefined,
    notes: api.notes ?? undefined,
    assignedVehicleId: api.assigned_vehicle_id ?? undefined,
    costCenterId: api.cost_center_id ?? undefined,
    userId: api.user_id ?? undefined,
    totalTrips: api.total_trips ?? undefined,
    totalDistance: api.total_distance ?? undefined,
    fuelEfficiencyScore: api.fuel_efficiency_score ?? undefined,
    safetyScore: api.safety_score ?? undefined,
    isBackoffice: api.is_backoffice ?? false,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformDrivers(apiList: DriverApiResponse[]): Driver[] {
  return apiList.map(transformDriver);
}

// Dashboard transformers
export function transformDashboardStats(api: DashboardStatsResponse): Partial<DashboardMetrics> {
  return {
    totalVehicles: api.total_vehicles,
    activeVehicles: api.active_vehicles,
    vehiclesInMaintenance: api.vehicles_in_maintenance,
    totalDrivers: api.total_drivers,
    driversOnDuty: api.drivers_on_duty,
    fuelCostThisMonth: api.fuel_cost_this_month,
    maintenanceCostThisMonth: api.maintenance_cost_this_month,
    maintenanceDueCount: api.maintenance_due_count,
    maintenanceOverdueCount: api.maintenance_overdue_count,
  };
}

// User transformers
export function transformUser(api: UserApiResponse): User {
  return {
    id: api.id,
    organizationId: api.organization_id,
    email: api.email,
    firstName: api.first_name,
    lastName: api.last_name,
    role: api.role as User["role"],
    avatar: api.avatar ?? undefined,
    phone: api.phone ?? undefined,
    isActive: api.is_active,
    lastLogin: api.last_login ?? undefined,
    themePreference: (api.theme_preference as User["themePreference"]) ?? "system",
    language: api.language ?? "en",
    dateFormat: (api.date_format as User["dateFormat"]) ?? "MM/DD/YYYY",
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

// Fuel Entry transformers
export function transformFuelEntry(api: FuelEntryApiResponse): FuelEntry {
  return {
    id: api.id,
    organizationId: api.organization_id,
    vehicleId: api.vehicle_id,
    driverId: api.employee_id ?? undefined,
    pumpId: api.pump_id ?? undefined,
    date: api.date,
    time: api.time ?? undefined,
    volume: Number(api.volume) || 0,
    pricePerUnit: Number(api.price_per_unit) || 0,
    totalCost: Number(api.total_cost) || 0,
    fuelType: api.fuel_type as FuelEntry["fuelType"],
    odometer: Number(api.odometer) || 0,
    pumpOdometer: api.pump_odometer != null ? Number(api.pump_odometer) : undefined,
    previousOdometer: api.previous_odometer != null ? Number(api.previous_odometer) : undefined,
    distance: api.distance != null ? Number(api.distance) : undefined,
    fuelEfficiency: api.fuel_efficiency != null ? Number(api.fuel_efficiency) : undefined,
    station: api.station ?? undefined,
    stationAddress: api.station_address ?? undefined,
    receiptNumber: api.receipt_number ?? undefined,
    receiptImage: api.receipt_image ?? undefined,
    fullTank: api.full_tank ?? false,
    notes: api.notes ?? undefined,
    costCenterId: api.cost_center_id ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformFuelEntries(apiList: FuelEntryApiResponse[]): FuelEntry[] {
  return apiList.map(transformFuelEntry);
}

export function transformFuelAnalytics(api: FuelAnalyticsApiResponse): FuelAnalytics {
  return {
    totalCost: Number(api.total_cost) || 0,
    totalVolume: Number(api.total_volume) || 0,
    averagePrice: Number(api.average_price_per_unit) || 0,
    averageEfficiency: Number(api.average_efficiency) || 0,
    entriesCount: Number(api.entries_count) || 0,
    costByMonth: [],
    efficiencyTrend: [],
    costByVehicle: [],
  };
}

// Maintenance Task transformers
export function transformMaintenanceTask(api: MaintenanceTaskApiResponse): MaintenanceTask {
  return {
    id: api.id,
    organizationId: api.organization_id,
    vehicleId: api.vehicle_id,
    costCenterId: api.cost_center_id ?? undefined,
    type: api.type as MaintenanceTask["type"],
    category: api.category,
    title: api.title,
    description: api.description ?? undefined,
    status: api.status as MaintenanceTask["status"],
    priority: api.priority as MaintenanceTask["priority"],
    scheduledDate: api.scheduled_date ?? undefined,
    dueOdometer: api.due_odometer != null ? Number(api.due_odometer) : undefined,
    completedDate: api.completed_date ?? undefined,
    completedOdometer: api.completed_odometer != null ? Number(api.completed_odometer) : undefined,
    estimatedCost: api.estimated_cost != null ? Number(api.estimated_cost) : undefined,
    actualCost: api.actual_cost != null ? Number(api.actual_cost) : undefined,
    laborCost: api.labor_cost != null ? Number(api.labor_cost) : undefined,
    partsCost: api.parts_cost != null ? Number(api.parts_cost) : undefined,
    serviceProvider: api.service_provider ?? undefined,
    serviceProviderContact: api.service_provider_contact ?? undefined,
    assignedTo: api.assigned_to ?? undefined,
    notes: api.notes ?? undefined,
    workOrderNumber: api.work_order_number ?? undefined,
    attachments: api.attachments ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformMaintenanceTasks(apiList: MaintenanceTaskApiResponse[]): MaintenanceTask[] {
  return apiList.map(transformMaintenanceTask);
}

// Maintenance Schedule transformers
export function transformMaintenanceSchedule(api: MaintenanceScheduleApiResponse): MaintenanceSchedule {
  return {
    id: api.id,
    organizationId: api.organization_id,
    vehicleId: api.vehicle_id,
    taskName: api.task_name,
    intervalType: api.interval_type as MaintenanceSchedule["intervalType"],
    intervalMileage: api.interval_mileage != null ? Number(api.interval_mileage) : undefined,
    intervalDays: api.interval_days ?? undefined,
    lastCompletedDate: api.last_completed_date ?? undefined,
    lastCompletedOdometer: api.last_completed_odometer != null ? Number(api.last_completed_odometer) : undefined,
    nextDueDate: api.next_due_date ?? undefined,
    nextDueOdometer: api.next_due_odometer != null ? Number(api.next_due_odometer) : undefined,
    estimatedCost: api.estimated_cost != null ? Number(api.estimated_cost) : undefined,
    isActive: api.is_active,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformMaintenanceSchedules(apiList: MaintenanceScheduleApiResponse[]): MaintenanceSchedule[] {
  return apiList.map(transformMaintenanceSchedule);
}

// Cost Center transformers
export function transformCostCenter(api: CostCenterApiResponse): CostCenter {
  return {
    id: api.id,
    organizationId: api.organization_id,
    code: api.code,
    name: api.name,
    description: api.description ?? undefined,
    parentId: api.parent_id ?? undefined,
    budget: api.budget ? Number(api.budget) : undefined,
    budgetPeriod: api.budget_period as CostCenter["budgetPeriod"] ?? undefined,
    currentSpend: api.current_spend ? Number(api.current_spend) : 0,
    isActive: api.is_active,
    managerId: api.manager_id ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformCostCenters(apiList: CostCenterApiResponse[]): CostCenter[] {
  return apiList.map(transformCostCenter);
}

// Ticket transformers
export function transformTicket(api: TicketApiResponse): Ticket {
  return {
    id: api.id,
    organizationId: api.organization_id,
    vehicleId: api.vehicle_id,
    driverId: api.employee_id ?? undefined,
    ticketNumber: api.ticket_number ?? undefined,
    type: api.type as Ticket["type"],
    status: api.status as Ticket["status"],
    description: api.description ?? undefined,
    violationDate: api.violation_date,
    violationLocation: api.violation_location ?? undefined,
    issuingAuthority: api.issuing_authority ?? undefined,
    amount: api.amount ? Number(api.amount) : 0,
    dueDate: api.due_date ?? undefined,
    paidDate: api.paid_date ?? undefined,
    paidAmount: api.paid_amount ? Number(api.paid_amount) : undefined,
    paymentMethod: api.payment_method as Ticket["paymentMethod"] ?? undefined,
    paymentReference: api.payment_reference ?? undefined,
    pointsDeducted: api.points_deducted ?? undefined,
    notes: api.notes ?? undefined,
    attachmentUrl: api.attachment_url ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformTickets(apiList: TicketApiResponse[]): Ticket[] {
  return apiList.map(transformTicket);
}

export function transformTicketStats(api: TicketStatsApiResponse): TicketStats {
  return {
    totalCount: api.total_count,
    pendingCount: api.pending_count,
    paidCount: api.paid_count,
    overdueCount: api.overdue_count,
    appealedCount: api.appealed_count,
    cancelledCount: api.cancelled_count,
    totalAmount: api.total_amount ? Number(api.total_amount) : 0,
    totalPaid: api.total_paid ? Number(api.total_paid) : 0,
    totalPending: api.total_pending ? Number(api.total_pending) : 0,
    totalOverdue: api.total_overdue ? Number(api.total_overdue) : 0,
  };
}

// Fuel Pump transformers
export function transformFuelPump(api: FuelPumpApiResponse): FuelPump {
  return {
    id: api.id,
    organizationId: api.organization_id,
    name: api.name,
    code: api.code,
    fuelType: api.fuel_type as FuelPump["fuelType"],
    status: api.status as FuelPump["status"],
    capacity: Number(api.capacity) || 0,
    currentLevel: Number(api.current_level) || 0,
    minimumLevel: Number(api.minimum_level) || 0,
    currentOdometer: Number(api.current_odometer) || 0,
    location: api.location ?? undefined,
    lastMaintenanceDate: api.last_maintenance_date ?? undefined,
    nextMaintenanceDate: api.next_maintenance_date ?? undefined,
    maintenanceIntervalDays: api.maintenance_interval_days ?? undefined,
    isDefault: api.is_default,
    notes: api.notes ?? undefined,
    levelPercentage: api.level_percentage ?? undefined,
    isLowLevel: api.is_low_level,
    isNearCapacity: api.is_near_capacity,
    isMaintenanceDue: api.is_maintenance_due,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformFuelPumps(apiList: FuelPumpApiResponse[]): FuelPump[] {
  return apiList.map(transformFuelPump);
}

export function transformFuelPumpStats(api: FuelPumpStatsResponse): FuelPumpStats {
  return {
    totalPumps: api.total_pumps,
    activePumps: api.active_pumps,
    totalCapacity: Number(api.total_capacity) || 0,
    totalCurrentLevel: Number(api.total_current_level) || 0,
    alertsCount: api.alerts_count,
  };
}

// Fuel Pump Delivery transformers
export function transformFuelPumpDelivery(api: FuelPumpDeliveryApiResponse): FuelPumpDelivery {
  return {
    id: api.id,
    organizationId: api.organization_id,
    pumpId: api.pump_id,
    deliveryDate: api.delivery_date,
    deliveryTime: api.delivery_time ?? undefined,
    volume: Number(api.volume) || 0,
    pricePerUnit: Number(api.price_per_unit) || 0,
    totalCost: Number(api.total_cost) || 0,
    supplier: api.supplier ?? undefined,
    invoiceNumber: api.invoice_number ?? undefined,
    receiptImage: api.receipt_image ?? undefined,
    pumpOdometerBefore: Number(api.pump_odometer_before) || 0,
    pumpOdometerAfter: api.pump_odometer_after ? Number(api.pump_odometer_after) : undefined,
    levelBefore: Number(api.level_before) || 0,
    levelAfter: Number(api.level_after) || 0,
    notes: api.notes ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformFuelPumpDeliveries(apiList: FuelPumpDeliveryApiResponse[]): FuelPumpDelivery[] {
  return apiList.map(transformFuelPumpDelivery);
}

export function transformFuelPumpDeliverySummary(api: FuelPumpDeliverySummaryResponse): FuelPumpDeliverySummary {
  return {
    totalVolume: Number(api.total_volume) || 0,
    totalCost: Number(api.total_cost) || 0,
    averagePricePerUnit: Number(api.average_price_per_unit) || 0,
    deliveriesCount: api.deliveries_count,
    periodStart: api.period_start,
    periodEnd: api.period_end,
  };
}

// Organization transformer
export function transformOrganization(api: OrganizationApiResponse): Organization {
  return {
    id: api.id,
    name: api.name,
    logo: api.logo ?? undefined,
    address: api.address ?? undefined,
    city: api.city ?? undefined,
    state: api.state ?? undefined,
    country: api.country ?? undefined,
    postalCode: api.postal_code ?? undefined,
    phone: api.phone ?? undefined,
    email: api.email ?? undefined,
    website: api.website ?? undefined,
    timezone: api.timezone,
    currency: api.currency,
    distanceUnit: api.distance_unit as Organization["distanceUnit"],
    volumeUnit: api.volume_unit as Organization["volumeUnit"],
    fuelEfficiencyFormat: api.fuel_efficiency_format as Organization["fuelEfficiencyFormat"],
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

// Notification transformers
export function transformNotification(api: NotificationApiResponse): Notification {
  return {
    id: api.id,
    userId: api.user_id,
    type: api.type,
    title: api.title,
    message: api.message,
    link: api.link ?? undefined,
    isRead: api.is_read,
    readAt: api.read_at ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformNotifications(apiList: NotificationApiResponse[]): Notification[] {
  return apiList.map(transformNotification);
}

// Notification Preferences transformers
export function transformNotificationPreferences(api: NotificationPreferencesApiResponse): NotificationPreferences {
  return {
    id: api.id,
    userId: api.user_id,
    emailEnabled: api.email_enabled,
    pushEnabled: api.push_enabled,
    smsEnabled: api.sms_enabled,
    emailAddress: api.email_address ?? undefined,
    phoneNumber: api.phone_number ?? undefined,
    quietHoursEnabled: api.quiet_hours_enabled,
    quietHoursStart: api.quiet_hours_start,
    quietHoursEnd: api.quiet_hours_end,
    notificationSettings: api.notification_settings,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

// Trip transformers
export function transformTrip(api: TripApiResponse): Trip {
  return {
    id: api.id,
    organizationId: api.organization_id,
    vehicleId: api.vehicle_id,
    driverId: api.employee_id ?? undefined,
    startTime: api.start_time,
    endTime: api.end_time ?? undefined,
    startLocation: {
      latitude: api.start_latitude,
      longitude: api.start_longitude,
      timestamp: api.start_timestamp,
      speed: api.start_speed ?? undefined,
      heading: api.start_heading ?? undefined,
      accuracy: api.start_accuracy ?? undefined,
    },
    endLocation: api.end_latitude && api.end_longitude ? {
      latitude: api.end_latitude,
      longitude: api.end_longitude,
      timestamp: api.end_timestamp ?? api.end_time ?? '',
      speed: api.end_speed ?? undefined,
      heading: api.end_heading ?? undefined,
      accuracy: api.end_accuracy ?? undefined,
    } : undefined,
    distance: api.distance ?? undefined,
    duration: api.duration ?? undefined,
    maxSpeed: api.max_speed ?? undefined,
    averageSpeed: api.average_speed ?? undefined,
    idleTime: api.idle_time ?? undefined,
    fuelConsumed: api.fuel_consumed ?? undefined,
    purpose: api.purpose ?? undefined,
    notes: api.notes ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformTrips(apiList: TripApiResponse[]): Trip[] {
  return apiList.map(transformTrip);
}

// Tool Category transformers
export function transformToolCategory(api: ToolCategoryResponse): ToolCategory {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    parentId: api.parent_id,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformToolCategories(apiList: ToolCategoryResponse[]): ToolCategory[] {
  return apiList.map(transformToolCategory);
}

// Tool Location transformers
export function transformToolLocation(api: ToolLocationResponse): ToolLocation {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    address: api.address,
    isActive: api.is_active,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformToolLocations(apiList: ToolLocationResponse[]): ToolLocation[] {
  return apiList.map(transformToolLocation);
}

// Tool Case transformers
export function transformToolCase(api: ToolCaseResponse): ToolCase {
  return {
    id: api.id,
    erpCode: api.erp_code,
    name: api.name,
    description: api.description,
    status: api.status as ToolCase["status"],
    condition: api.condition as ToolCase["condition"],
    images: api.images,
    notes: api.notes,
    locationId: api.location_id,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformToolCases(apiList: ToolCaseResponse[]): ToolCase[] {
  return apiList.map(transformToolCase);
}

// Tool transformers
export function transformTool(api: ToolResponse): Tool {
  return {
    id: api.id,
    erpCode: api.erp_code,
    name: api.name,
    description: api.description,
    serialNumber: api.serial_number,
    brand: api.brand,
    model: api.model,
    categoryId: api.category_id,
    caseId: api.case_id,
    status: api.status as Tool["status"],
    condition: api.condition as Tool["condition"],
    images: api.images,
    purchaseDate: api.purchase_date,
    purchasePrice: api.purchase_price,
    locationId: api.location_id,
    calibrationRequired: api.calibration_required,
    calibrationIntervalDays: api.calibration_interval_days,
    lastCalibrationDate: api.last_calibration_date,
    nextCalibrationDate: api.next_calibration_date,
    notes: api.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformTools(apiList: ToolResponse[]): Tool[] {
  return apiList.map(transformTool);
}

// Tool Assignment transformers
export function transformToolAssignment(api: ToolAssignmentResponse): ToolAssignment {
  return {
    id: api.id,
    organizationId: api.organization_id,
    toolId: api.tool_id,
    caseId: api.case_id,
    assignmentType: api.assignment_type as ToolAssignment["assignmentType"],
    assignedToEmployeeId: api.assigned_to_employee_id,
    assignedToVehicleId: api.assigned_to_vehicle_id,
    department: api.department,
    section: api.section,
    locationId: api.location_id,
    assignedAt: api.assigned_at,
    returnedAt: api.returned_at,
    assignedById: api.assigned_by_id,
    conditionAtCheckout: api.condition_at_checkout as ToolAssignment["conditionAtCheckout"],
    conditionAtReturn: api.condition_at_return as ToolAssignment["conditionAtReturn"],
    notes: api.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformToolAssignments(apiList: ToolAssignmentResponse[]): ToolAssignment[] {
  return apiList.map(transformToolAssignment);
}

// Tool Calibration transformers
export function transformToolCalibration(api: ToolCalibrationResponse): ToolCalibration {
  return {
    id: api.id,
    organizationId: api.organization_id,
    toolId: api.tool_id,
    calibrationDate: api.calibration_date,
    nextCalibrationDate: api.next_calibration_date,
    certificateNumber: api.certificate_number,
    calibratedBy: api.calibrated_by,
    certificateUrl: api.certificate_url,
    cost: api.cost,
    notes: api.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformToolCalibrations(apiList: ToolCalibrationResponse[]): ToolCalibration[] {
  return apiList.map(transformToolCalibration);
}

// Consumable transformers
export function transformConsumable(api: ConsumableResponse): Consumable {
  return {
    id: api.id,
    erpCode: api.erp_code,
    name: api.name,
    description: api.description,
    brand: api.brand,
    model: api.model,
    unit: api.unit as Consumable["unit"],
    currentQuantity: api.current_quantity,
    minimumQuantity: api.minimum_quantity,
    reorderQuantity: api.reorder_quantity,
    status: api.status as Consumable["status"],
    caseId: api.case_id,
    categoryId: api.category_id,
    locationId: api.location_id,
    purchaseDate: api.purchase_date,
    purchasePrice: api.purchase_price,
    notes: api.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transformConsumables(apiList: ConsumableResponse[]): Consumable[] {
  return apiList.map(transformConsumable);
}

// Reverse transformers (camelCase to snake_case for requests)
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      const value = obj[key];

      if (value !== undefined) {
        result[snakeKey] = value;
      }
    }
  }

  return result;
}
