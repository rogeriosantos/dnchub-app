/**
 * Fuel Pump Deliveries API Service
 */

import type { FuelPumpDelivery, FuelPumpDeliverySummary } from "@/types";
import { apiClient } from "./client";
import type {
  FuelPumpDeliveryApiResponse,
  FuelPumpDeliveryCreateRequest,
  FuelPumpDeliveryUpdateRequest,
  FuelPumpDeliverySummaryResponse,
  ListParams,
} from "./types";
import {
  transformFuelPumpDelivery,
  transformFuelPumpDeliveries,
  transformFuelPumpDeliverySummary,
} from "./transformers";

export interface FuelPumpDeliveryListParams extends ListParams {
  pump_id?: string;
  start_date?: string;
  end_date?: string;
}

export const fuelPumpDeliveriesService = {
  /**
   * Get all fuel pump deliveries
   */
  async getAll(params?: FuelPumpDeliveryListParams): Promise<FuelPumpDelivery[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      pump_id: params?.pump_id,
      start_date: params?.start_date,
      end_date: params?.end_date,
    };

    const response = await apiClient.get<FuelPumpDeliveryApiResponse[]>(
      "/fuel-pump-deliveries",
      { params: queryParams }
    );
    return transformFuelPumpDeliveries(response);
  },

  /**
   * Get fuel pump delivery by ID
   */
  async getById(id: string): Promise<FuelPumpDelivery> {
    const response = await apiClient.get<FuelPumpDeliveryApiResponse>(
      `/fuel-pump-deliveries/${id}`
    );
    return transformFuelPumpDelivery(response);
  },

  /**
   * Get deliveries for a specific pump
   */
  async getByPump(pumpId: string, params?: ListParams): Promise<FuelPumpDelivery[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
    };

    const response = await apiClient.get<FuelPumpDeliveryApiResponse[]>(
      `/fuel-pump-deliveries/pump/${pumpId}`,
      { params: queryParams }
    );
    return transformFuelPumpDeliveries(response);
  },

  /**
   * Get delivery summary for a date range
   */
  async getSummary(startDate: string, endDate: string): Promise<FuelPumpDeliverySummary> {
    const response = await apiClient.get<FuelPumpDeliverySummaryResponse>(
      "/fuel-pump-deliveries/summary",
      { params: { start_date: startDate, end_date: endDate } }
    );
    return transformFuelPumpDeliverySummary(response);
  },

  /**
   * Create new fuel pump delivery (automatically updates pump level)
   */
  async create(data: FuelPumpDeliveryCreateRequest): Promise<FuelPumpDelivery> {
    const response = await apiClient.post<FuelPumpDeliveryApiResponse>(
      "/fuel-pump-deliveries",
      data
    );
    return transformFuelPumpDelivery(response);
  },

  /**
   * Update fuel pump delivery
   */
  async update(id: string, data: FuelPumpDeliveryUpdateRequest): Promise<FuelPumpDelivery> {
    const response = await apiClient.patch<FuelPumpDeliveryApiResponse>(
      `/fuel-pump-deliveries/${id}`,
      data
    );
    return transformFuelPumpDelivery(response);
  },

  /**
   * Delete fuel pump delivery (soft delete)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/fuel-pump-deliveries/${id}`);
  },
};
