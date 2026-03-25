/**
 * Maintenance API service
 */

import { apiClient } from "./client";
import { toSnakeCase } from "./transformers";
import type { MaintenanceTask, MaintenanceStatus, Vehicle } from "@/types";

// API response type (snake_case from backend)
export interface MaintenanceTaskApiResponse {
  id: string;
  organization_id: string;
  vehicle_id: string;
  type: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  completed_date: string | null;
  due_odometer: number | null;
  completed_odometer: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  labor_cost: number | null;
  parts_cost: number | null;
  service_provider: string | null;
  service_provider_contact: string | null;
  assigned_to: string | null;
  notes: string | null;
  attachments: string[] | null;
  work_order_number: string | null;
  cost_center_id: string | null;
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
  cost_center_id?: string;
}

export interface ListParams {
  skip?: number;
  limit?: number;
  status?: MaintenanceStatus;
  vehicle_id?: string;
}

function transformMaintenanceTask(api: MaintenanceTaskApiResponse): MaintenanceTask {
  return {
    id: api.id,
    organizationId: api.organization_id,
    vehicleId: api.vehicle_id,
    type: api.type as MaintenanceTask["type"],
    category: api.category,
    title: api.title,
    description: api.description ?? undefined,
    status: api.status as MaintenanceTask["status"],
    priority: api.priority as MaintenanceTask["priority"],
    scheduledDate: api.scheduled_date ?? undefined,
    completedDate: api.completed_date ?? undefined,
    dueOdometer: api.due_odometer ?? undefined,
    completedOdometer: api.completed_odometer ?? undefined,
    estimatedCost: api.estimated_cost ?? undefined,
    actualCost: api.actual_cost ?? undefined,
    laborCost: api.labor_cost ?? undefined,
    partsCost: api.parts_cost ?? undefined,
    serviceProvider: api.service_provider ?? undefined,
    serviceProviderContact: api.service_provider_contact ?? undefined,
    assignedTo: api.assigned_to ?? undefined,
    notes: api.notes ?? undefined,
    attachments: api.attachments ?? undefined,
    workOrderNumber: api.work_order_number ?? undefined,
    costCenterId: api.cost_center_id ?? undefined,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function transformMaintenanceTasks(apiList: MaintenanceTaskApiResponse[]): MaintenanceTask[] {
  return apiList.map(transformMaintenanceTask);
}

export const maintenanceService = {
  /**
   * Get all maintenance tasks
   */
  async getAll(params?: ListParams): Promise<MaintenanceTask[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      status: params?.status,
      vehicle_id: params?.vehicle_id,
    };

    const response = await apiClient.get<MaintenanceTaskApiResponse[]>("/maintenance/tasks", {
      params: queryParams,
    });

    return transformMaintenanceTasks(response);
  },

  /**
   * Get maintenance task by ID
   */
  async getById(id: string): Promise<MaintenanceTask> {
    const response = await apiClient.get<MaintenanceTaskApiResponse>(`/maintenance/tasks/${id}`);
    return transformMaintenanceTask(response);
  },

  /**
   * Create a new maintenance task
   */
  async create(data: Partial<MaintenanceTask>): Promise<MaintenanceTask> {
    const request = toSnakeCase(data) as unknown as MaintenanceTaskCreateRequest;
    const response = await apiClient.post<MaintenanceTaskApiResponse>("/maintenance/tasks", request);
    return transformMaintenanceTask(response);
  },

  /**
   * Update a maintenance task
   */
  async update(id: string, data: Partial<MaintenanceTask>): Promise<MaintenanceTask> {
    const request = toSnakeCase(data);
    const response = await apiClient.patch<MaintenanceTaskApiResponse>(`/maintenance/tasks/${id}`, request);
    return transformMaintenanceTask(response);
  },

  /**
   * Delete a maintenance task
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/maintenance/tasks/${id}`);
  },

  /**
   * Complete a maintenance task
   */
  async complete(id: string, actualCost?: number, notes?: string): Promise<MaintenanceTask> {
    const params: Record<string, string | number> = {};
    if (actualCost !== undefined) params.actual_cost = actualCost;
    if (notes) params.notes = notes;

    const response = await apiClient.post<MaintenanceTaskApiResponse>(
      `/maintenance/tasks/${id}/complete`,
      undefined,
      { params }
    );
    return transformMaintenanceTask(response);
  },

  /**
   * Cancel a maintenance task
   */
  async cancel(id: string, reason?: string): Promise<MaintenanceTask> {
    const params: Record<string, string> = {};
    if (reason) params.reason = reason;

    const response = await apiClient.post<MaintenanceTaskApiResponse>(
      `/maintenance/tasks/${id}/cancel`,
      undefined,
      { params }
    );
    return transformMaintenanceTask(response);
  },

  /**
   * Get overdue maintenance tasks
   */
  async getOverdue(): Promise<MaintenanceTask[]> {
    const response = await apiClient.get<MaintenanceTaskApiResponse[]>("/maintenance/tasks/overdue");
    return transformMaintenanceTasks(response);
  },

  /**
   * Get upcoming maintenance tasks
   */
  async getUpcoming(days: number = 7): Promise<MaintenanceTask[]> {
    const response = await apiClient.get<MaintenanceTaskApiResponse[]>("/maintenance/tasks/upcoming", {
      params: { days },
    });
    return transformMaintenanceTasks(response);
  },
};

export default maintenanceService;
