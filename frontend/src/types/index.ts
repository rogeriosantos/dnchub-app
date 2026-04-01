// FleetOptima - Shared Domain Types (camelCase)

// =============================================================================
// ENUMS
// =============================================================================

export type VehicleStatus = "active" | "maintenance" | "out_of_service" | "in_transit" | "idle";
export type VehicleType = "sedan" | "suv" | "truck" | "van" | "pickup" | "motorcycle" | "bus" | "heavy_truck" | "trailer";
export type FuelType = "diesel" | "petrol" | "gasoline" | "electric" | "hybrid" | "lpg" | "cng";
export type DriverStatus = "available" | "on_duty" | "off_duty" | "on_leave" | "suspended" | "on_break" | "on_trip";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "overdue" | "cancelled";
export type MaintenancePriority = "low" | "medium" | "high" | "critical";
export type MaintenanceType = "preventive" | "corrective" | "inspection" | "recall" | "emergency";
export type DocumentStatus = "valid" | "expiring_soon" | "expired";
export type UserRole = "admin" | "fleet_manager" | "operator" | "viewer" | "technician";
export type DistanceUnit = "km" | "mi";
export type VolumeUnit = "l" | "gal";
export type FuelEfficiencyFormat = "km/l" | "l/100km" | "mpg";
export type TicketType = "speed" | "parking" | "toll" | "red_light" | "other";
export type TicketStatus = "pending" | "paid" | "appealed" | "cancelled" | "overdue";
export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "bank_transfer" | "check" | "other";
export type PumpStatus = "active" | "inactive" | "maintenance" | "out_of_service";
export type ThemePreference = "light" | "dark" | "system";
export type DateFormatPreference = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
export type ToolStatus = "available" | "assigned" | "in_repair" | "in_calibration" | "lost" | "retired";
export type ToolCondition = "new" | "good" | "fair" | "needs_repair" | "damaged";
export type ToolAssignmentType = "employee" | "vehicle" | "department" | "section" | "location";
export type ConsumableStatus = "in_stock" | "low_stock" | "out_of_stock" | "ordered" | "retired";
export type ConsumableUnit = "piece" | "box" | "pair" | "set" | "kg" | "gram" | "liter" | "ml" | "meter" | "roll" | "can" | "bottle" | "tube" | "sheet";

// =============================================================================
// BASE ENTITIES
// =============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// USER & ORGANIZATION
// =============================================================================

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  organizationId: string;
  isActive: boolean;
  lastLogin?: string;
  themePreference: ThemePreference;
  language: string;
  dateFormat: DateFormatPreference;
}

export interface Organization extends BaseEntity {
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  currency: string;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  fuelEfficiencyFormat: FuelEfficiencyFormat;
}

// =============================================================================
// VEHICLE
// =============================================================================

export interface Vehicle extends BaseEntity {
  registrationPlate: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
  color?: string;
  currentOdometer: number;
  fuelCapacity?: number;
  assignedDriverId?: string;
  assignedDriver?: Driver;
  costCenterId?: string;
  costCenter?: CostCenter;
  image?: string;
  insuranceExpiry?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  registrationExpiry?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  nextServiceDue?: string;
  nextServiceOdometer?: number;
  notes?: string;
  averageFuelEfficiency?: number;
  totalFuelCost?: number;
  totalMaintenanceCost?: number;
  organizationId: string;
}

export interface VehicleGroup extends BaseEntity {
  name: string;
  description?: string;
  vehicleIds: string[];
  organizationId: string;
}

// =============================================================================
// DRIVER
// =============================================================================

export interface Driver extends BaseEntity {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  status: DriverStatus;
  licenseNumber: string;
  licenseIssueDate?: string;
  licenseExpiry: string;
  licenseClass: string;
  dateOfBirth?: string;
  hireDate: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  assignedVehicleId?: string;
  assignedVehicle?: Vehicle;
  costCenterId?: string;
  userId?: string;
  totalTrips?: number;
  totalDistance?: number;
  fuelEfficiencyScore?: number;
  safetyScore?: number;
  isBackoffice: boolean;
  organizationId: string;
}

// =============================================================================
// FUEL
// =============================================================================

export interface FuelEntry extends BaseEntity {
  vehicleId: string;
  vehicle?: Vehicle;
  driverId?: string;
  driver?: Driver;
  pumpId?: string;
  pump?: FuelPump;
  date: string;
  time?: string;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  fuelType: FuelType;
  odometer: number;
  pumpOdometer?: number;
  previousOdometer?: number;
  distance?: number;
  fuelEfficiency?: number;
  station?: string;
  stationAddress?: string;
  receiptNumber?: string;
  receiptImage?: string;
  fullTank: boolean;
  notes?: string;
  paymentMethod?: string;
  costCenterId?: string;
  organizationId: string;
}

export interface FuelAnalytics {
  totalCost: number;
  totalVolume: number;
  averagePrice: number;
  averageEfficiency: number;
  entriesCount: number;
  costByMonth: { month: string; cost: number }[];
  efficiencyTrend: { date: string; efficiency: number }[];
  costByVehicle: { vehicleId: string; registrationPlate: string; cost: number }[];
}

// =============================================================================
// FUEL PUMP
// =============================================================================

export interface FuelPump extends BaseEntity {
  organizationId: string;
  name: string;
  code: string;
  fuelType: FuelType;
  status: PumpStatus;
  capacity: number;
  currentLevel: number;
  minimumLevel: number;
  currentOdometer: number;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceIntervalDays?: number;
  isDefault: boolean;
  notes?: string;
  levelPercentage?: number;
  isLowLevel?: boolean;
  isNearCapacity?: boolean;
  isMaintenanceDue?: boolean;
}

export interface FuelPumpDelivery extends BaseEntity {
  organizationId: string;
  pumpId: string;
  pump?: FuelPump;
  deliveryDate: string;
  deliveryTime?: string;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  receiptImage?: string;
  pumpOdometerBefore: number;
  pumpOdometerAfter?: number;
  levelBefore: number;
  levelAfter: number;
  notes?: string;
}

export interface FuelPumpStats {
  totalPumps: number;
  activePumps: number;
  totalCapacity: number;
  totalCurrentLevel: number;
  alertsCount: number;
}

export interface FuelPumpDeliverySummary {
  totalVolume: number;
  totalCost: number;
  averagePricePerUnit: number;
  deliveriesCount: number;
  periodStart: string;
  periodEnd: string;
}

// =============================================================================
// MAINTENANCE
// =============================================================================

export interface MaintenanceTask extends BaseEntity {
  vehicleId: string;
  vehicle?: Vehicle;
  type: MaintenanceType;
  category: string;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  scheduledDate?: string;
  completedDate?: string;
  dueOdometer?: number;
  completedOdometer?: number;
  estimatedCost?: number;
  actualCost?: number;
  laborCost?: number;
  partsCost?: number;
  serviceProvider?: string;
  serviceProviderContact?: string;
  assignedTo?: string;
  notes?: string;
  attachments?: string[];
  workOrderNumber?: string;
  costCenterId?: string;
  organizationId: string;
}

export interface MaintenanceSchedule extends BaseEntity {
  vehicleId: string;
  vehicle?: Vehicle;
  taskName: string;
  intervalType: "mileage" | "time" | "both";
  intervalMileage?: number;
  intervalDays?: number;
  lastCompletedDate?: string;
  lastCompletedOdometer?: number;
  nextDueDate?: string;
  nextDueOdometer?: number;
  estimatedCost?: number;
  isActive: boolean;
  organizationId: string;
}

// =============================================================================
// COST CENTER
// =============================================================================

export interface CostCenter extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: CostCenter;
  budget?: number;
  budgetPeriod?: "monthly" | "quarterly" | "yearly";
  currentSpend?: number;
  isActive: boolean;
  managerId?: string;
  manager?: User;
  organizationId: string;
}

export interface CostAllocation extends BaseEntity {
  costCenterId: string;
  costCenter?: CostCenter;
  sourceType: "fuel" | "maintenance" | "insurance" | "registration" | "other";
  sourceId: string;
  amount: number;
  date: string;
  description?: string;
  organizationId: string;
}

// =============================================================================
// GPS & TRIPS
// =============================================================================

export interface GpsPosition {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface Trip extends BaseEntity {
  vehicleId: string;
  vehicle?: Vehicle;
  driverId?: string;
  driver?: Driver;
  startTime: string;
  endTime?: string;
  startLocation: GpsPosition;
  endLocation?: GpsPosition;
  distance?: number;
  duration?: number;
  maxSpeed?: number;
  averageSpeed?: number;
  idleTime?: number;
  fuelConsumed?: number;
  purpose?: string;
  notes?: string;
  route?: GpsPosition[];
  organizationId: string;
}

export interface Geofence extends BaseEntity {
  name: string;
  description?: string;
  type: "circle" | "polygon";
  center?: GpsPosition;
  radius?: number;
  coordinates?: GpsPosition[];
  isActive: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  organizationId: string;
}

export interface GpsAlert extends BaseEntity {
  vehicleId: string;
  vehicle?: Vehicle;
  type: "speeding" | "geofence_entry" | "geofence_exit" | "harsh_braking" | "harsh_acceleration" | "idle";
  severity: "low" | "medium" | "high";
  message: string;
  location: GpsPosition;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  organizationId: string;
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export interface Document extends BaseEntity {
  entityType: "vehicle" | "employee" | "organization";
  entityId: string;
  type: string;
  name: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate?: string;
  status: DocumentStatus;
  notes?: string;
  uploadedBy: string;
  organizationId: string;
}

// =============================================================================
// TICKETS
// =============================================================================

export interface Ticket extends BaseEntity {
  organizationId: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId?: string;
  driver?: Driver;
  ticketNumber?: string;
  type: TicketType;
  status: TicketStatus;
  description?: string;
  violationDate: string;
  violationLocation?: string;
  issuingAuthority?: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  pointsDeducted?: number;
  notes?: string;
  attachmentUrl?: string;
}

export interface TicketStats {
  totalCount: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  appealedCount: number;
  cancelledCount: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export interface Notification extends BaseEntity {
  userId: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
}

export interface NotificationSettingItem {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationPreferences extends BaseEntity {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationSettings: Record<string, NotificationSettingItem>;
}

// =============================================================================
// DASHBOARD METRICS
// =============================================================================

export interface DashboardMetrics {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInMaintenance: number;
  totalDrivers: number;
  driversOnDuty: number;
  fuelCostThisMonth: number;
  fuelCostLastMonth: number;
  maintenanceCostThisMonth: number;
  maintenanceDueCount: number;
  maintenanceOverdueCount: number;
  averageFleetEfficiency: number;
  totalDistanceThisMonth: number;
  expiringDocumentsCount: number;
  alertsCount: number;
}

export interface FleetOverviewData {
  vehiclesByStatus: { status: VehicleStatus; count: number }[];
  vehiclesByType: { type: VehicleType; count: number }[];
  fuelCostTrend: { date: string; cost: number }[];
  maintenanceCostTrend: { date: string; cost: number }[];
  topFuelConsumers: { vehicleId: string; registrationPlate: string; consumption: number }[];
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "fuel" | "maintenance" | "trip" | "document" | "alert";
  title: string;
  description: string;
  timestamp: string;
  entityId?: string;
  entityType?: string;
}

// =============================================================================
// TOOL MANAGEMENT
// =============================================================================

export interface ToolCategory extends BaseEntity {
  name: string;
  description: string | null;
  parentId: string | null;
}

export interface ToolLocation extends BaseEntity {
  name: string;
  description: string | null;
  address: string | null;
  isActive: boolean;
}

export interface ToolCase extends BaseEntity {
  erpCode: string;
  name: string;
  description: string | null;
  status: ToolStatus;
  condition: ToolCondition;
  images: string[] | null;
  notes: string | null;
  locationId: string | null;
}

export interface Tool extends BaseEntity {
  erpCode: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  categoryId: string | null;
  caseId: string | null;
  status: ToolStatus;
  condition: ToolCondition;
  images: string[] | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  locationId: string | null;
  calibrationRequired: boolean;
  calibrationIntervalDays: number | null;
  lastCalibrationDate: string | null;
  nextCalibrationDate: string | null;
  notes: string | null;
}

export interface ToolAssignment {
  id: string;
  organizationId: string;
  toolId: string | null;
  caseId: string | null;
  assignmentType: ToolAssignmentType;
  assignedToEmployeeId: string | null;
  assignedToVehicleId: string | null;
  department: string | null;
  section: string | null;
  locationId: string | null;
  assignedAt: string;
  returnedAt: string | null;
  assignedById: string;
  conditionAtCheckout: ToolCondition | null;
  conditionAtReturn: ToolCondition | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCalibration {
  id: string;
  organizationId: string;
  toolId: string;
  calibrationDate: string;
  nextCalibrationDate: string | null;
  certificateNumber: string | null;
  calibratedBy: string | null;
  certificateUrl: string | null;
  cost: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Consumable extends BaseEntity {
  erpCode: string;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  unit: ConsumableUnit;
  currentQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number | null;
  status: ConsumableStatus;
  caseId: string | null;
  categoryId: string | null;
  locationId: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  notes: string | null;
}

// =============================================================================
// NAVIGATION
// =============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  url: string;
  badge?: {
    type: "count" | "status";
    value?: number;
    color?: "default" | "success" | "warning" | "danger" | "info";
  };
  children?: NavItem[];
  roles?: UserRole[];
  isActive?: boolean;
}

// =============================================================================
// API & PAGINATION
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface FilterOptions {
  search?: string;
  status?: string[];
  type?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
