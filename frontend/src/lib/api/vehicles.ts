/**
 * Vehicles API service
 */

import { apiClient } from "./client";
import type {
  VehicleApiResponse,
  VehicleCreateRequest,
  VehicleUpdateRequest,
  ListParams,
} from "./types";
import { transformVehicle, transformVehicles, toSnakeCase } from "./transformers";
import type { Vehicle, VehicleStatus } from "@/types";

export interface VehicleListParams extends ListParams {
  status?: VehicleStatus;
}

export const vehiclesService = {
  /**
   * Get all vehicles
   */
  async getAll(params?: VehicleListParams): Promise<Vehicle[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      status: params?.status,
    };

    const response = await apiClient.get<VehicleApiResponse[]>("/vehicles", {
      params: queryParams,
    });

    return transformVehicles(response);
  },

  /**
   * Get available vehicles for assignment
   */
  async getAvailable(): Promise<Vehicle[]> {
    const response = await apiClient.get<VehicleApiResponse[]>("/vehicles/available");
    return transformVehicles(response);
  },

  /**
   * Get vehicle by ID
   */
  async getById(id: string): Promise<Vehicle> {
    const response = await apiClient.get<VehicleApiResponse>(`/vehicles/${id}`);
    return transformVehicle(response);
  },

  /**
   * Create a new vehicle
   */
  async create(data: Partial<Vehicle>): Promise<Vehicle> {
    const request = toSnakeCase(data) as unknown as VehicleCreateRequest;
    const response = await apiClient.post<VehicleApiResponse>("/vehicles", request);
    return transformVehicle(response);
  },

  /**
   * Update a vehicle
   */
  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const request = toSnakeCase(data) as unknown as VehicleUpdateRequest;
    const response = await apiClient.patch<VehicleApiResponse>(`/vehicles/${id}`, request);
    return transformVehicle(response);
  },

  /**
   * Delete a vehicle
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  },

  /**
   * Update vehicle odometer
   */
  async updateOdometer(id: string, newOdometer: number): Promise<Vehicle> {
    const response = await apiClient.post<VehicleApiResponse>(
      `/vehicles/${id}/odometer`,
      undefined,
      { params: { new_odometer: newOdometer } }
    );
    return transformVehicle(response);
  },
};

export default vehiclesService;
