/**
 * Fuel API service
 */

import { apiClient } from "./client";
import type {
  FuelEntryApiResponse,
  FuelEntryCreateRequest,
  FuelEntryUpdateRequest,
  FuelAnalyticsApiResponse,
  ListParams,
} from "./types";
import { transformFuelEntry, transformFuelEntries, transformFuelAnalytics, toSnakeCase } from "./transformers";
import type { FuelEntry, FuelAnalytics } from "@/types";

export interface FuelEntryListParams extends ListParams {
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

export const fuelService = {
  /**
   * Get all fuel entries
   */
  async getAll(params?: FuelEntryListParams): Promise<FuelEntry[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      vehicle_id: params?.vehicleId,
      employee_id: params?.driverId,
      start_date: params?.startDate,
      end_date: params?.endDate,
    };

    const response = await apiClient.get<FuelEntryApiResponse[]>("/fuel", {
      params: queryParams,
    });

    return transformFuelEntries(response);
  },

  /**
   * Get fuel entry by ID
   */
  async getById(id: string): Promise<FuelEntry> {
    const response = await apiClient.get<FuelEntryApiResponse>(`/fuel/${id}`);
    return transformFuelEntry(response);
  },

  /**
   * Get fuel entries by vehicle
   */
  async getByVehicle(vehicleId: string, params?: ListParams): Promise<FuelEntry[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
    };

    const response = await apiClient.get<FuelEntryApiResponse[]>(`/fuel/vehicle/${vehicleId}`, {
      params: queryParams,
    });

    return transformFuelEntries(response);
  },

  /**
   * Get fuel entries by driver
   */
  async getByDriver(driverId: string, params?: ListParams): Promise<FuelEntry[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
    };

    const response = await apiClient.get<FuelEntryApiResponse[]>(`/fuel/employee/${driverId}`, {
      params: queryParams,
    });

    return transformFuelEntries(response);
  },

  /**
   * Create a new fuel entry
   */
  async create(data: Partial<FuelEntry>): Promise<FuelEntry> {
    const request = toSnakeCase(data) as unknown as FuelEntryCreateRequest;
    const response = await apiClient.post<FuelEntryApiResponse>("/fuel", request);
    return transformFuelEntry(response);
  },

  /**
   * Update a fuel entry
   */
  async update(id: string, data: Partial<FuelEntry>): Promise<FuelEntry> {
    const request = toSnakeCase(data) as unknown as FuelEntryUpdateRequest;
    const response = await apiClient.patch<FuelEntryApiResponse>(`/fuel/${id}`, request);
    return transformFuelEntry(response);
  },

  /**
   * Delete a fuel entry
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/fuel/${id}`);
  },

  /**
   * Get fuel analytics for a date range
   */
  async getAnalytics(startDate: string, endDate: string): Promise<FuelAnalytics> {
    const response = await apiClient.get<FuelAnalyticsApiResponse>("/fuel/analytics", {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });

    return transformFuelAnalytics(response);
  },
};

export default fuelService;
