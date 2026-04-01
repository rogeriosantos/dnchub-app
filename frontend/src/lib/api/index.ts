/**
 * API Services - Central export point
 */

// Core client
export { apiClient, tokenStorage, ApiClientError } from "./client";

// Services
export { authService } from "./auth";
export { organizationsService } from "./organizations";
export { usersService } from "./users";
export { vehiclesService } from "./vehicles";
export { driversService } from "./drivers";
export { dashboardService } from "./dashboard";
export { fuelService } from "./fuel";
export { fuelPumpsService } from "./fuel-pumps";
export { fuelPumpDeliveriesService } from "./fuel-pump-deliveries";
export { maintenanceService } from "./maintenance";
export { ticketsService } from "./tickets";
export { tripsService } from "./trips";
export { notificationsService } from "./notifications";
export { notificationPreferencesService } from "./notification-preferences";
export {
  toolCategoriesService,
  toolLocationsService,
  toolCasesService,
  toolsService,
  toolAssignmentsService,
  toolCalibrationsService,
  consumablesService,
} from "./tools";

// Types
export type {
  LoginRequest,
  TokenResponse,
  RefreshTokenRequest,
  ApiListResponse,
  ListParams,
  VehicleApiResponse,
  VehicleCreateRequest,
  VehicleUpdateRequest,
  DriverApiResponse,
  DriverCreateRequest,
  DriverUpdateRequest,
  DashboardStatsResponse,
  VehicleStatusCount,
  UserApiResponse,
  UserUpdateRequest,
  UserPasswordUpdateRequest,
  UserCreateRequest,
  FuelEntryApiResponse,
  FuelEntryCreateRequest,
  FuelEntryUpdateRequest,
  FuelAnalyticsApiResponse,
  FuelPumpApiResponse,
  FuelPumpCreateRequest,
  FuelPumpUpdateRequest,
  FuelPumpLevelAdjustmentRequest,
  FuelPumpStatsResponse,
  FuelPumpDeliveryApiResponse,
  FuelPumpDeliveryCreateRequest,
  FuelPumpDeliveryUpdateRequest,
  FuelPumpDeliverySummaryResponse,
  OrganizationApiResponse,
  OrganizationUpdateRequest,
  NotificationApiResponse,
  NotificationListParams,
  NotificationPreferencesApiResponse,
  NotificationPreferencesUpdateRequest,
  ChannelsUpdateRequest,
  QuietHoursUpdateRequest,
  NotificationSettingUpdateRequest,
  ToolCategoryResponse,
  ToolLocationResponse,
  ToolCaseResponse,
  ToolResponse,
  ToolAssignmentResponse,
  ToolCalibrationResponse,
  ConsumableResponse,
} from "./types";

// List params
export type { VehicleListParams } from "./vehicles";
export type { DriverListParams } from "./drivers";
export type { FuelEntryListParams } from "./fuel";
export type { FuelPumpListParams } from "./fuel-pumps";
export type { FuelPumpDeliveryListParams } from "./fuel-pump-deliveries";
export type { TicketListParams } from "./tickets";
export type {
  ToolListParams,
  ToolCaseListParams,
  ToolAssignmentListParams,
  ToolCalibrationListParams,
  ConsumableListParams,
} from "./tools";

// Transformers (for custom use cases)
export {
  transformVehicle,
  transformVehicles,
  transformDriver,
  transformDrivers,
  transformDashboardStats,
  transformUser,
  transformFuelEntry,
  transformFuelEntries,
  transformFuelAnalytics,
  transformFuelPump,
  transformFuelPumps,
  transformFuelPumpStats,
  transformFuelPumpDelivery,
  transformFuelPumpDeliveries,
  transformFuelPumpDeliverySummary,
  transformTicket,
  transformTickets,
  transformTicketStats,
  transformTrip,
  transformTrips,
  transformOrganization,
  transformNotification,
  transformNotifications,
  transformNotificationPreferences,
  transformToolCategory,
  transformToolCategories,
  transformToolLocation,
  transformToolLocations,
  transformToolCase,
  transformToolCases,
  transformTool,
  transformTools,
  transformToolAssignment,
  transformToolAssignments,
  transformToolCalibration,
  transformToolCalibrations,
  transformConsumable,
  transformConsumables,
  toSnakeCase,
} from "./transformers";
