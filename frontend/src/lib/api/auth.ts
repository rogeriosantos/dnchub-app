/**
 * Authentication API service
 */

import { apiClient, tokenStorage } from "./client";
import type { LoginRequest, TokenResponse, UserApiResponse } from "./types";
import { transformUser } from "./transformers";
import type { User } from "@/types";

export interface RegisterRequest {
  organization_name: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface MessagingChannelsResponse {
  channels: string[];
  email_enabled: boolean;
  whatsapp_enabled: boolean;
}

export interface PinResetRequest {
  employee_id: string;
  delivery_method: "email" | "whatsapp";
}

export interface PinResetResponse {
  success: boolean;
  message: string;
  delivery_method: string;
}

export interface PinChangeRequest {
  employee_id: string;
  current_pin: string;
  new_pin: string;
}

export interface PinChangeResponse {
  success: boolean;
  message: string;
}

export interface POSDriverInfo {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  status: string;
  is_backoffice: boolean;
}

export interface POSVehicleInfo {
  id: string;
  registration_plate: string;
  make: string;
  model: string;
  year: number;
  fuel_type: string;
  current_odometer: number;
  status: string;
}

export interface POSPumpInfo {
  id: string;
  name: string;
  code: string;
  fuel_type: string;
  status: string;
  capacity: number;
  current_level: number;
  current_odometer: number;
  level_percentage: number;
  is_default: boolean;
}

export interface POSFuelEntryCreate {
  employee_id: string;
  vehicle_id: string;
  odometer: number;
  volume: number;
  notes?: string;
  date?: string; // Optional date for backdating (backoffice only)

  // Internal pump fields (required for internal, optional for external)
  pump_id?: string;
  pump_odometer?: number;

  // External station fields
  is_external?: boolean;
  station_name?: string; // e.g., "BP", "Shell", "Galp"
  station_address?: string;
  price_per_unit?: number; // Price per liter
  total_cost?: number; // Total cost
  receipt_image?: string; // Base64 image or URL
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: TokenResponse }> {
    const tokens = await apiClient.post<TokenResponse>("/auth/login", {
      email,
      password,
    } as LoginRequest);

    // Store tokens
    tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);

    // Get current user info
    const userResponse = await apiClient.get<UserApiResponse>("/users/me");
    const user = transformUser(userResponse);

    return { user, tokens };
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const tokens = await apiClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });

    tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);

    return tokens;
  },

  /**
   * Logout - clear tokens
   */
  logout(): void {
    tokenStorage.clearTokens();
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const userResponse = await apiClient.get<UserApiResponse>("/users/me");
    return transformUser(userResponse);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  },

  /**
   * Register a new organization with admin user
   */
  async register(data: RegisterRequest): Promise<{ user: User; tokens: TokenResponse }> {
    const tokens = await apiClient.post<TokenResponse>("/auth/register", data);

    // Store tokens
    tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);

    // Get current user info
    const userResponse = await apiClient.get<UserApiResponse>("/users/me");
    const user = transformUser(userResponse);

    return { user, tokens };
  },

  /**
   * Get drivers list for POS login screen (public endpoint)
   */
  async getPOSDrivers(): Promise<POSDriverInfo[]> {
    return apiClient.get<POSDriverInfo[]>("/auth/pos-employees");
  },

  /**
   * Get vehicles assigned to a driver for POS (public endpoint)
   * @param allVehicles - If true, returns all vehicles in organization (for "Other Vehicle" selection)
   */
  async getPOSVehicles(driverId: string, allVehicles: boolean = false): Promise<POSVehicleInfo[]> {
    const url = allVehicles
      ? `/auth/pos-vehicles/${driverId}?all_vehicles=true`
      : `/auth/pos-vehicles/${driverId}`;
    return apiClient.get<POSVehicleInfo[]>(url);
  },

  /**
   * Get all fuel pumps for POS (public endpoint)
   */
  async getAllPOSPumps(): Promise<POSPumpInfo[]> {
    return apiClient.get<POSPumpInfo[]>("/auth/pos-pumps");
  },

  /**
   * Get fuel pumps by fuel type for POS (public endpoint)
   */
  async getPOSPumps(fuelType: string): Promise<POSPumpInfo[]> {
    return apiClient.get<POSPumpInfo[]>(`/auth/pos-pumps/${fuelType}`);
  },

  /**
   * Create a fuel entry from POS (public endpoint)
   */
  async createPOSFuelEntry(data: POSFuelEntryCreate): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>("/auth/pos-fuel-entry", data);
  },

  /**
   * Validate driver PIN for POS access
   * Stores the driver token for subsequent API calls
   * Returns true if PIN is valid, false otherwise
   */
  async validateDriverPin(employeeId: string, pin: string): Promise<boolean> {
    try {
      const tokens = await apiClient.post<TokenResponse>("/auth/employee-login", {
        employee_id: employeeId,
        pin,
      });
      // Store the driver token for subsequent POS API calls
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get available messaging channels for PIN delivery
   */
  async getMessagingChannels(): Promise<MessagingChannelsResponse> {
    return apiClient.get<MessagingChannelsResponse>("/auth/messaging-channels");
  },

  /**
   * Request PIN reset - sends new PIN via email or WhatsApp
   */
  async resetDriverPin(employeeId: string, deliveryMethod: "email" | "whatsapp"): Promise<PinResetResponse> {
    return apiClient.post<PinResetResponse>("/auth/employee-pin-reset", {
      employee_id: employeeId,
      delivery_method: deliveryMethod,
    });
  },

  /**
   * Change driver PIN - requires current PIN for verification
   */
  async changeDriverPin(employeeId: string, currentPin: string, newPin: string): Promise<PinChangeResponse> {
    return apiClient.post<PinChangeResponse>("/auth/employee-pin-change", {
      employee_id: employeeId,
      current_pin: currentPin,
      new_pin: newPin,
    });
  },
};

export default authService;
