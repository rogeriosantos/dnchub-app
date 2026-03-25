/**
 * API-specific types
 */

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Generic API response types
export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Query params for list endpoints
export interface ListParams {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Vehicle API types (snake_case from backend)
export interface VehicleApiResponse {
  id: string;
  organization_id: string;
  registration_plate: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  type: string;
  fuel_type: string;
  status: string;
  color: string | null;
  current_odometer: number;
  fuel_capacity: number | null;
  assigned_employee_id: string | null;
  cost_center_id: string | null;
  image: string | null;
  insurance_expiry: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  registration_expiry: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  next_service_odometer: number | null;
  notes: string | null;
  average_fuel_efficiency: number | null;
  total_fuel_cost: number | null;
  total_maintenance_cost: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface VehicleCreateRequest {
  registration_plate: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  type: string;
  fuel_type: string;
  status?: string;
  color?: string;
  current_odometer?: number;
  fuel_capacity?: number;
  assigned_employee_id?: string;
  cost_center_id?: string;
  insurance_expiry?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  registration_expiry?: string;
  notes?: string;
}

export interface VehicleUpdateRequest {
  registration_plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  type?: string;
  fuel_type?: string;
  status?: string;
  color?: string;
  current_odometer?: number;
  fuel_capacity?: number;
  assigned_employee_id?: string;
  cost_center_id?: string;
  insurance_expiry?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  registration_expiry?: string;
  notes?: string;
}

// Driver API types
export interface DriverApiResponse {
  id: string;
  organization_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: string;
  license_number: string;
  license_class: string;
  license_issue_date: string | null;
  license_expiry: string;
  date_of_birth: string | null;
  hire_date: string;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  assigned_vehicle_id: string | null;
  cost_center_id: string | null;
  user_id: string | null;
  total_trips: number | null;
  total_distance: number | null;
  fuel_efficiency_score: number | null;
  safety_score: number | null;
  is_backoffice: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface DriverCreateRequest {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_class: string;
  license_expiry: string;
  hire_date: string;
  status?: string;
  license_issue_date?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  assigned_vehicle_id?: string;
  cost_center_id?: string;
  is_backoffice?: boolean;
}

export interface DriverUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  license_number?: string;
  license_class?: string;
  license_issue_date?: string;
  license_expiry?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  assigned_vehicle_id?: string;
  cost_center_id?: string;
  is_backoffice?: boolean;
}

// Dashboard API types
export interface DashboardStatsResponse {
  total_vehicles: number;
  active_vehicles: number;
  vehicles_in_maintenance: number;
  total_drivers: number;
  drivers_on_duty: number;
  fuel_cost_this_month: number;
  fuel_cost_change_percent: number;
  maintenance_cost_this_month: number;
  maintenance_due_count: number;
  maintenance_overdue_count: number;
}

export interface VehicleStatusCount {
  status: string;
  count: number;
}

// User API types
export interface UserApiResponse {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  is_active: boolean;
  last_login: string | null;
  theme_preference: string;
  language: string;
  date_format: string;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  avatar?: string;
  phone?: string;
  theme_preference?: string;
  language?: string;
  date_format?: string;
}

export interface UserPasswordUpdateRequest {
  current_password: string;
  new_password: string;
}

export interface UserCreateRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role?: string;
  phone?: string;
  is_active?: boolean;
}

// Fuel Entry API types
export interface FuelEntryApiResponse {
  id: string;
  organization_id: string;
  vehicle_id: string;
  employee_id: string | null;
  pump_id: string | null;
  date: string;
  time: string | null;
  volume: number;
  price_per_unit: number;
  total_cost: number;
  fuel_type: string;
  odometer: number;
  pump_odometer: number | null;
  previous_odometer: number | null;
  distance: number | null;
  fuel_efficiency: number | null;
  station: string | null;
  station_address: string | null;
  receipt_number: string | null;
  receipt_image: string | null;
  full_tank: boolean;
  payment_method: string | null;
  notes: string | null;
  cost_center_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelEntryCreateRequest {
  vehicle_id: string;
  employee_id?: string;
  pump_id?: string;
  date: string;
  time?: string;
  volume: number;
  price_per_unit: number;
  fuel_type: string;
  odometer: number;
  pump_odometer?: number;
  station?: string;
  station_address?: string;
  receipt_number?: string;
  receipt_image?: string;
  full_tank?: boolean;
  payment_method?: string;
  notes?: string;
  cost_center_id?: string;
}

export interface FuelEntryUpdateRequest {
  date?: string;
  time?: string;
  volume?: number;
  price_per_unit?: number;
  fuel_type?: string;
  odometer?: number;
  station?: string;
  station_address?: string;
  receipt_number?: string;
  receipt_image?: string;
  full_tank?: boolean;
  payment_method?: string;
  notes?: string;
  employee_id?: string;
  cost_center_id?: string;
}

export interface FuelAnalyticsApiResponse {
  total_volume: number;
  total_cost: number;
  average_price_per_unit: number;
  average_efficiency: number | null;
  entries_count: number;
  period_start: string;
  period_end: string;
}

// Maintenance Task API types
export interface MaintenanceTaskApiResponse {
  id: string;
  organization_id: string;
  vehicle_id: string;
  cost_center_id: string | null;
  type: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  due_odometer: number | null;
  completed_date: string | null;
  completed_odometer: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  labor_cost: number | null;
  parts_cost: number | null;
  service_provider: string | null;
  service_provider_contact: string | null;
  assigned_to: string | null;
  notes: string | null;
  work_order_number: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface MaintenanceTaskCreateRequest {
  vehicle_id: string;
  type: string;
  category: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  scheduled_date?: string;
  due_odometer?: number;
  estimated_cost?: number;
  service_provider?: string;
  service_provider_contact?: string;
  assigned_to?: string;
  notes?: string;
  work_order_number?: string;
  cost_center_id?: string;
}

export interface MaintenanceTaskUpdateRequest {
  type?: string;
  category?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  scheduled_date?: string;
  completed_date?: string;
  due_odometer?: number;
  completed_odometer?: number;
  estimated_cost?: number;
  actual_cost?: number;
  labor_cost?: number;
  parts_cost?: number;
  service_provider?: string;
  service_provider_contact?: string;
  assigned_to?: string;
  notes?: string;
  work_order_number?: string;
  attachments?: string[];
  cost_center_id?: string;
}

// Maintenance Schedule API types
export interface MaintenanceScheduleApiResponse {
  id: string;
  organization_id: string;
  vehicle_id: string;
  task_name: string;
  interval_type: string;
  interval_mileage: number | null;
  interval_days: number | null;
  last_completed_date: string | null;
  last_completed_odometer: number | null;
  next_due_date: string | null;
  next_due_odometer: number | null;
  estimated_cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface MaintenanceScheduleCreateRequest {
  vehicle_id: string;
  task_name: string;
  interval_type: string;
  interval_mileage?: number;
  interval_days?: number;
  estimated_cost?: number;
  is_active?: boolean;
}

export interface MaintenanceScheduleUpdateRequest {
  task_name?: string;
  interval_type?: string;
  interval_mileage?: number;
  interval_days?: number;
  last_completed_date?: string;
  last_completed_odometer?: number;
  next_due_date?: string;
  next_due_odometer?: number;
  estimated_cost?: number;
  is_active?: boolean;
}

export interface MaintenanceCostSummaryResponse {
  total_cost: number;
  labor_cost: number;
  parts_cost: number;
  tasks_completed: number;
  average_cost_per_task: number;
}

// Cost Center API types
export interface CostCenterApiResponse {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  budget: string | null; // Decimal comes as string from backend
  budget_period: string | null;
  is_active: boolean;
  manager_id: string | null;
  current_spend: string; // Decimal comes as string from backend
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface CostCenterCreateRequest {
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  budget?: number;
  budget_period?: string;
  is_active?: boolean;
  manager_id?: string;
}

export interface CostCenterUpdateRequest {
  code?: string;
  name?: string;
  description?: string;
  parent_id?: string;
  budget?: number;
  budget_period?: string;
  is_active?: boolean;
  manager_id?: string;
}

export interface CostCenterSummaryResponse {
  total_cost: number;
  fuel_cost: number;
  maintenance_cost: number;
  other_cost: number;
  period_start: string;
  period_end: string;
}

export interface BudgetStatusResponse {
  cost_center_id: string;
  budget: number | null;
  budget_period: string | null;
  current_spend: number;
  utilization_percentage: number | null;
  remaining_budget: number | null;
  is_over_budget: boolean;
}

// Ticket API types
export interface TicketApiResponse {
  id: string;
  organization_id: string;
  vehicle_id: string;
  employee_id: string | null;
  ticket_number: string | null;
  type: string;
  status: string;
  description: string | null;
  violation_date: string;
  violation_location: string | null;
  issuing_authority: string | null;
  amount: string; // Decimal comes as string from backend
  due_date: string | null;
  paid_date: string | null;
  paid_amount: string | null; // Decimal comes as string from backend
  payment_method: string | null;
  payment_reference: string | null;
  points_deducted: number | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface TicketCreateRequest {
  vehicle_id: string;
  employee_id?: string;
  ticket_number?: string;
  type: string;
  description?: string;
  violation_date: string;
  violation_location?: string;
  issuing_authority?: string;
  amount: number;
  due_date?: string;
  points_deducted?: number;
  notes?: string;
  attachment_url?: string;
}

export interface TicketUpdateRequest {
  employee_id?: string;
  ticket_number?: string;
  type?: string;
  status?: string;
  description?: string;
  violation_date?: string;
  violation_location?: string;
  issuing_authority?: string;
  amount?: number;
  due_date?: string;
  points_deducted?: number;
  notes?: string;
  attachment_url?: string;
}

export interface TicketPayRequest {
  paid_date: string;
  paid_amount: number;
  payment_method: string;
  payment_reference?: string;
}

export interface TicketStatsApiResponse {
  total_count: number;
  pending_count: number;
  paid_count: number;
  overdue_count: number;
  appealed_count: number;
  cancelled_count: number;
  total_amount: string; // Decimal comes as string from backend
  total_paid: string;
  total_pending: string;
  total_overdue: string;
}

// Fuel Pump API types
export interface FuelPumpApiResponse {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  fuel_type: string;
  status: string;
  capacity: string; // Decimal comes as string
  current_level: string;
  minimum_level: string;
  current_odometer: string;
  location: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  maintenance_interval_days: number | null;
  is_default: boolean;
  notes: string | null;
  level_percentage: number | null;
  is_low_level: boolean;
  is_near_capacity: boolean;
  is_maintenance_due: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface FuelPumpCreateRequest {
  name: string;
  code: string;
  fuel_type: string;
  status?: string;
  capacity: number;
  current_level?: number;
  minimum_level?: number;
  current_odometer?: number;
  location?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_days?: number;
  is_default?: boolean;
  notes?: string;
}

export interface FuelPumpUpdateRequest {
  name?: string;
  code?: string;
  fuel_type?: string;
  status?: string;
  capacity?: number;
  current_level?: number;
  minimum_level?: number;
  current_odometer?: number;
  location?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_days?: number;
  is_default?: boolean;
  notes?: string;
}

export interface FuelPumpLevelAdjustmentRequest {
  adjustment: number;
}

export interface FuelPumpStatsResponse {
  total_pumps: number;
  active_pumps: number;
  total_capacity: string; // Decimal comes as string
  total_current_level: string;
  alerts_count: number;
}

// Fuel Pump Delivery API types
export interface FuelPumpDeliveryApiResponse {
  id: string;
  organization_id: string;
  pump_id: string;
  delivery_date: string;
  delivery_time: string | null;
  volume: string; // Decimal comes as string
  price_per_unit: string;
  total_cost: string;
  supplier: string | null;
  invoice_number: string | null;
  receipt_image: string | null;
  pump_odometer_before: string;
  pump_odometer_after: string | null;
  level_before: string;
  level_after: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface FuelPumpDeliveryCreateRequest {
  pump_id: string;
  delivery_date: string;
  delivery_time?: string;
  volume: number;
  price_per_unit: number;
  supplier?: string;
  invoice_number?: string;
  receipt_image?: string;
  pump_odometer_before: number; // Required - current pump odometer
  pump_odometer_after?: number;
  level_before: number; // Required - current pump level
  level_after: number; // Required - level after delivery
  notes?: string;
}

export interface FuelPumpDeliveryUpdateRequest {
  delivery_date?: string;
  delivery_time?: string;
  volume?: number;
  price_per_unit?: number;
  supplier?: string;
  invoice_number?: string;
  receipt_image?: string;
  pump_odometer_after?: number;
  notes?: string;
}

export interface FuelPumpDeliverySummaryResponse {
  total_volume: string; // Decimal comes as string
  total_cost: string;
  average_price_per_unit: string;
  deliveries_count: number;
  period_start: string;
  period_end: string;
}

// Organization API types
export interface OrganizationApiResponse {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  distance_unit: string;
  volume_unit: string;
  fuel_efficiency_format: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrganizationUpdateRequest {
  name?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  currency?: string;
  distance_unit?: string;
  volume_unit?: string;
  fuel_efficiency_format?: string;
}

// Notification API types
export interface NotificationApiResponse {
  id: string;
  user_id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreateRequest {
  user_id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  link?: string;
}

export interface NotificationListParams {
  skip?: number;
  limit?: number;
  unread_only?: boolean;
  notification_type?: "info" | "warning" | "error" | "success";
}

// Notification Preferences API types
export interface NotificationSettingItem {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationPreferencesApiResponse {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_address: string | null;
  phone_number: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_settings: Record<string, NotificationSettingItem>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesUpdateRequest {
  email_enabled?: boolean;
  push_enabled?: boolean;
  sms_enabled?: boolean;
  email_address?: string;
  phone_number?: string;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  notification_settings?: Record<string, NotificationSettingItem>;
}

export interface ChannelsUpdateRequest {
  email_enabled?: boolean;
  push_enabled?: boolean;
  sms_enabled?: boolean;
  email_address?: string;
  phone_number?: string;
}

export interface QuietHoursUpdateRequest {
  enabled: boolean;
  start?: string;
  end?: string;
}

export interface NotificationSettingUpdateRequest {
  notification_key: string;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

// Tool Management API types
export interface ToolCategoryResponse {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolLocationResponse {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolCaseResponse {
  id: string;
  organization_id: string;
  erp_code: string;
  name: string;
  description: string | null;
  status: string;
  condition: string;
  images: string[] | null;
  notes: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolResponse {
  id: string;
  organization_id: string;
  erp_code: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  brand: string | null;
  model: string | null;
  category_id: string | null;
  case_id: string | null;
  status: string;
  condition: string;
  images: string[] | null;
  purchase_date: string | null;
  purchase_price: string | null;
  location_id: string | null;
  calibration_required: boolean;
  calibration_interval_days: number | null;
  last_calibration_date: string | null;
  next_calibration_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolAssignmentResponse {
  id: string;
  organization_id: string;
  tool_id: string | null;
  case_id: string | null;
  assignment_type: string;
  assigned_to_employee_id: string | null;
  assigned_to_vehicle_id: string | null;
  department: string | null;
  section: string | null;
  location_id: string | null;
  assigned_at: string;
  returned_at: string | null;
  assigned_by_id: string;
  condition_at_checkout: string | null;
  condition_at_return: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolCalibrationResponse {
  id: string;
  organization_id: string;
  tool_id: string;
  calibration_date: string;
  next_calibration_date: string | null;
  certificate_number: string | null;
  calibrated_by: string | null;
  certificate_url: string | null;
  cost: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Trip API types
export interface TripApiResponse {
  id: string;
  organization_id: string;
  vehicle_id: string;
  employee_id: string | null;
  start_time: string;
  end_time: string | null;
  start_latitude: number;
  start_longitude: number;
  start_timestamp: string;
  start_speed: number | null;
  start_heading: number | null;
  start_accuracy: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  end_timestamp: string | null;
  end_speed: number | null;
  end_heading: number | null;
  end_accuracy: number | null;
  distance: number | null;
  duration: number | null;
  max_speed: number | null;
  average_speed: number | null;
  idle_time: number | null;
  fuel_consumed: number | null;
  purpose: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
