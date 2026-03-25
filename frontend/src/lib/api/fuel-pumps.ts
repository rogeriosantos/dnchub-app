/**
 * Fuel Pumps API Service
 */

import type { FuelPump, FuelPumpStats, FuelType } from "@/types";
import { apiClient } from "./client";
import type {
  FuelPumpApiResponse,
  FuelPumpCreateRequest,
  FuelPumpUpdateRequest,
  FuelPumpLevelAdjustmentRequest,
  FuelPumpStatsResponse,
  ListParams,
} from "./types";
import { transformFuelPump, transformFuelPumps, transformFuelPumpStats } from "./transformers";

export interface FuelPumpListParams extends ListParams {
  fuel_type?: string;
  status?: string;
}

export const fuelPumpsService = {
  /**
   * Get all fuel pumps
   */
  async getAll(params?: FuelPumpListParams): Promise<FuelPump[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      fuel_type: params?.fuel_type,
      status: params?.status,
    };

    const response = await apiClient.get<FuelPumpApiResponse[]>("/fuel-pumps", {
      params: queryParams,
    });
    return transformFuelPumps(response);
  },

  /**
   * Get fuel pump by ID
   */
  async getById(id: string): Promise<FuelPump> {
    const response = await apiClient.get<FuelPumpApiResponse>(`/fuel-pumps/${id}`);
    return transformFuelPump(response);
  },

  /**
   * Get fuel pumps by fuel type (useful for POS pump selection)
   */
  async getByFuelType(fuelType: FuelType, activeOnly: boolean = true): Promise<FuelPump[]> {
    const response = await apiClient.get<FuelPumpApiResponse[]>(
      `/fuel-pumps/by-fuel-type/${fuelType}`,
      { params: { active_only: activeOnly } }
    );
    return transformFuelPumps(response);
  },

  /**
   * Get fuel pumps with active alerts (low level or maintenance due)
   */
  async getAlerts(): Promise<FuelPump[]> {
    const response = await apiClient.get<FuelPumpApiResponse[]>("/fuel-pumps/alerts");
    return transformFuelPumps(response);
  },

  /**
   * Get pump statistics
   */
  async getStats(): Promise<FuelPumpStats> {
    const response = await apiClient.get<FuelPumpStatsResponse>("/fuel-pumps/stats");
    return transformFuelPumpStats(response);
  },

  /**
   * Create new fuel pump
   */
  async create(data: FuelPumpCreateRequest): Promise<FuelPump> {
    const response = await apiClient.post<FuelPumpApiResponse>("/fuel-pumps", data);
    return transformFuelPump(response);
  },

  /**
   * Update fuel pump
   */
  async update(id: string, data: FuelPumpUpdateRequest): Promise<FuelPump> {
    const response = await apiClient.patch<FuelPumpApiResponse>(`/fuel-pumps/${id}`, data);
    return transformFuelPump(response);
  },

  /**
   * Delete fuel pump (soft delete)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/fuel-pumps/${id}`);
  },

  /**
   * Manually adjust pump level
   */
  async adjustLevel(id: string, adjustment: number): Promise<FuelPump> {
    const request: FuelPumpLevelAdjustmentRequest = { adjustment };
    const response = await apiClient.post<FuelPumpApiResponse>(
      `/fuel-pumps/${id}/adjust-level`,
      request
    );
    return transformFuelPump(response);
  },
};
