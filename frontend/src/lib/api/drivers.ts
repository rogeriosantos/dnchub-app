/**
 * Drivers API service
 */

import { apiClient } from "./client";
import type {
  DriverApiResponse,
  DriverCreateRequest,
  DriverUpdateRequest,
  ListParams,
} from "./types";
import { transformDriver, transformDrivers, toSnakeCase } from "./transformers";
import type { Driver, DriverStatus } from "@/types";

export interface DriverListParams extends ListParams {
  status?: DriverStatus;
}

export const driversService = {
  /**
   * Get all drivers
   */
  async getAll(params?: DriverListParams): Promise<Driver[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      status: params?.status,
    };

    const response = await apiClient.get<DriverApiResponse[]>("/employees", {
      params: queryParams,
    });

    return transformDrivers(response);
  },

  /**
   * Get available drivers for assignment
   */
  async getAvailable(): Promise<Driver[]> {
    const response = await apiClient.get<DriverApiResponse[]>("/employees/available");
    return transformDrivers(response);
  },

  /**
   * Get driver by ID
   */
  async getById(id: string): Promise<Driver> {
    const response = await apiClient.get<DriverApiResponse>(`/employees/${id}`);
    return transformDriver(response);
  },

  /**
   * Create a new driver
   */
  async create(data: Partial<Driver>): Promise<Driver> {
    const request = toSnakeCase(data) as unknown as DriverCreateRequest;
    const response = await apiClient.post<DriverApiResponse>("/employees", request);
    return transformDriver(response);
  },

  /**
   * Update a driver
   */
  async update(id: string, data: Partial<Driver>): Promise<Driver> {
    const request = toSnakeCase(data) as unknown as DriverUpdateRequest;
    const response = await apiClient.patch<DriverApiResponse>(`/employees/${id}`, request);
    return transformDriver(response);
  },

  /**
   * Delete a driver
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/employees/${id}`);
  },

  /**
   * Update driver status
   */
  async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
    const response = await apiClient.patch<DriverApiResponse>(`/employees/${id}/status`, {
      status,
    });
    return transformDriver(response);
  },

  /**
   * Get driver by assigned vehicle ID (handles inconsistent data)
   */
  async getByVehicle(vehicleId: string): Promise<Driver | null> {
    try {
      const response = await apiClient.get<DriverApiResponse | null>(`/employees/by-vehicle/${vehicleId}`);
      if (response) {
        return transformDriver(response);
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Sync all driver-vehicle assignments to fix inconsistent data
   */
  async syncAssignments(): Promise<{ synced: number; message: string }> {
    const response = await apiClient.post<{ synced: number; message: string }>("/employees/sync-assignments");
    return response;
  },

  /**
   * Set driver PIN code for POS access
   */
  async setPin(id: string, pinCode: string): Promise<Driver> {
    const response = await apiClient.post<DriverApiResponse>(`/employees/${id}/pin?pin_code=${pinCode}`);
    return transformDriver(response);
  },
};

export default driversService;
