/**
 * Trips API service
 */

import { apiClient } from "./client";
import type { TripApiResponse, ListParams } from "./types";
import { transformTrip, transformTrips } from "./transformers";
import type { Trip } from "@/types";

export interface TripListParams extends ListParams {
  vehicleId?: string;
  driverId?: string;
}

export const tripsService = {
  /**
   * Get all trips
   */
  async getAll(params?: TripListParams): Promise<Trip[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      vehicle_id: params?.vehicleId,
      employee_id: params?.driverId,
    };

    const response = await apiClient.get<TripApiResponse[]>("/gps/trips", {
      params: queryParams,
    });

    return transformTrips(response);
  },

  /**
   * Get trip by ID
   */
  async getById(id: string): Promise<Trip> {
    const response = await apiClient.get<TripApiResponse>(`/gps/trips/${id}`);
    return transformTrip(response);
  },

  /**
   * Get trips by vehicle
   */
  async getByVehicle(vehicleId: string, params?: ListParams): Promise<Trip[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      vehicle_id: vehicleId,
    };

    const response = await apiClient.get<TripApiResponse[]>("/gps/trips", {
      params: queryParams,
    });

    return transformTrips(response);
  },

  /**
   * Get trips by driver
   */
  async getByDriver(driverId: string, params?: ListParams): Promise<Trip[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      employee_id: driverId,
    };

    const response = await apiClient.get<TripApiResponse[]>("/gps/trips", {
      params: queryParams,
    });

    return transformTrips(response);
  },

  /**
   * Get active trip for a vehicle
   */
  async getActiveTrip(vehicleId: string): Promise<Trip | null> {
    const response = await apiClient.get<TripApiResponse | null>(
      `/gps/trips/active/${vehicleId}`
    );
    return response ? transformTrip(response) : null;
  },
};

export default tripsService;
