/**
 * Cost Centers API service
 */

import { apiClient } from "./client";
import type {
  CostCenterApiResponse,
  CostCenterCreateRequest,
  CostCenterUpdateRequest,
  CostCenterSummaryResponse,
  BudgetStatusResponse,
  ListParams,
} from "./types";
import { transformCostCenter, transformCostCenters, toSnakeCase } from "./transformers";
import type { CostCenter } from "@/types";

export interface CostCenterListParams extends ListParams {
  activeOnly?: boolean;
}

export const costCentersService = {
  /**
   * Get all cost centers
   */
  async getAll(params?: CostCenterListParams): Promise<CostCenter[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      active_only: params?.activeOnly,
    };

    const response = await apiClient.get<CostCenterApiResponse[]>("/cost-centers", {
      params: queryParams,
    });

    return transformCostCenters(response);
  },

  /**
   * Get cost center by ID
   */
  async getById(id: string): Promise<CostCenter> {
    const response = await apiClient.get<CostCenterApiResponse>(`/cost-centers/${id}`);
    return transformCostCenter(response);
  },

  /**
   * Create a new cost center
   */
  async create(data: Partial<CostCenter>): Promise<CostCenter> {
    const request = toSnakeCase(data) as unknown as CostCenterCreateRequest;
    const response = await apiClient.post<CostCenterApiResponse>("/cost-centers", request);
    return transformCostCenter(response);
  },

  /**
   * Update a cost center
   */
  async update(id: string, data: Partial<CostCenter>): Promise<CostCenter> {
    const request = toSnakeCase(data) as unknown as CostCenterUpdateRequest;
    const response = await apiClient.patch<CostCenterApiResponse>(`/cost-centers/${id}`, request);
    return transformCostCenter(response);
  },

  /**
   * Delete a cost center
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cost-centers/${id}`);
  },

  /**
   * Get cost summary for a cost center
   */
  async getSummary(id: string, startDate: string, endDate: string): Promise<CostCenterSummaryResponse> {
    const response = await apiClient.get<CostCenterSummaryResponse>(`/cost-centers/${id}/summary`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response;
  },

  /**
   * Get budget status for a cost center
   */
  async getBudgetStatus(id: string, startDate: string, endDate: string): Promise<BudgetStatusResponse> {
    const response = await apiClient.get<BudgetStatusResponse>(`/cost-centers/${id}/budget-status`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response;
  },
};

export default costCentersService;
