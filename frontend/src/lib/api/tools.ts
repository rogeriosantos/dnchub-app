/**
 * Tool Management API services
 */

import { apiClient } from "./client";
import type {
  ToolResponse,
  ToolCaseResponse,
  ToolCategoryResponse,
  ToolLocationResponse,
  ToolAssignmentResponse,
  ToolCalibrationResponse,
  ConsumableResponse,
  ListParams,
} from "./types";
import {
  transformTool,
  transformTools,
  transformToolCase,
  transformToolCases,
  transformToolCategory,
  transformToolCategories,
  transformToolLocation,
  transformToolLocations,
  transformToolAssignment,
  transformToolAssignments,
  transformToolCalibration,
  transformToolCalibrations,
  transformConsumable,
  transformConsumables,
  toSnakeCase,
} from "./transformers";
import type {
  Tool,
  ToolCase,
  ToolCategory,
  ToolLocation,
  ToolAssignment,
  ToolCalibration,
  ToolStatus,
  ToolCondition,
  Consumable,
  ConsumableStatus,
  ConsumableUnit,
} from "@/types";

// List params
export interface ToolListParams extends ListParams {
  status?: ToolStatus;
  condition?: ToolCondition;
  category_id?: string;
  case_id?: string;
  location_id?: string;
  calibration_required?: boolean;
}

export interface ToolCaseListParams extends ListParams {
  status?: ToolStatus;
  condition?: ToolCondition;
  location_id?: string;
}

export interface ConsumableListParams extends ListParams {
  case_id?: string;
  status?: ConsumableStatus;
  unit?: ConsumableUnit;
  category_id?: string;
  location_id?: string;
  low_stock_only?: boolean;
}

export interface ToolAssignmentListParams extends ListParams {
  tool_id?: string;
  case_id?: string;
  employee_id?: string;
  vehicle_id?: string;
  active_only?: boolean;
}

export interface ToolCalibrationListParams extends ListParams {
  tool_id?: string;
}

// =============================================================================
// TOOL CATEGORIES
// =============================================================================

export const toolCategoriesService = {
  /**
   * Get all tool categories
   */
  async getAll(params?: ListParams): Promise<ToolCategory[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
    };

    const response = await apiClient.get<ToolCategoryResponse[]>("/tool-categories", {
      params: queryParams,
    });

    return transformToolCategories(response);
  },

  /**
   * Get tool category by ID
   */
  async getById(id: string): Promise<ToolCategory> {
    const response = await apiClient.get<ToolCategoryResponse>(`/tool-categories/${id}`);
    return transformToolCategory(response);
  },

  /**
   * Create a new tool category
   */
  async create(data: Partial<ToolCategory>): Promise<ToolCategory> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ToolCategoryResponse>("/tool-categories", request);
    return transformToolCategory(response);
  },

  /**
   * Update a tool category
   */
  async update(id: string, data: Partial<ToolCategory>): Promise<ToolCategory> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.put<ToolCategoryResponse>(`/tool-categories/${id}`, request);
    return transformToolCategory(response);
  },

  /**
   * Delete a tool category
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tool-categories/${id}`);
  },
};

// =============================================================================
// TOOL LOCATIONS
// =============================================================================

export const toolLocationsService = {
  /**
   * Get all tool locations
   */
  async getAll(params?: ListParams): Promise<ToolLocation[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
    };

    const response = await apiClient.get<ToolLocationResponse[]>("/tool-locations", {
      params: queryParams,
    });

    return transformToolLocations(response);
  },

  /**
   * Get tool location by ID
   */
  async getById(id: string): Promise<ToolLocation> {
    const response = await apiClient.get<ToolLocationResponse>(`/tool-locations/${id}`);
    return transformToolLocation(response);
  },

  /**
   * Create a new tool location
   */
  async create(data: Partial<ToolLocation>): Promise<ToolLocation> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ToolLocationResponse>("/tool-locations", request);
    return transformToolLocation(response);
  },

  /**
   * Update a tool location
   */
  async update(id: string, data: Partial<ToolLocation>): Promise<ToolLocation> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.put<ToolLocationResponse>(`/tool-locations/${id}`, request);
    return transformToolLocation(response);
  },

  /**
   * Delete a tool location
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tool-locations/${id}`);
  },
};

// =============================================================================
// TOOL CASES
// =============================================================================

export const toolCasesService = {
  /**
   * Get all tool cases
   */
  async getAll(params?: ToolCaseListParams): Promise<ToolCase[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
      status: params?.status,
      condition: params?.condition,
      location_id: params?.location_id,
    };

    const response = await apiClient.get<ToolCaseResponse[]>("/tool-cases", {
      params: queryParams,
    });

    return transformToolCases(response);
  },

  /**
   * Get tool case by ID
   */
  async getById(id: string): Promise<ToolCase> {
    const response = await apiClient.get<ToolCaseResponse>(`/tool-cases/${id}`);
    return transformToolCase(response);
  },

  /**
   * Create a new tool case
   */
  async create(data: Partial<ToolCase>): Promise<ToolCase> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ToolCaseResponse>("/tool-cases", request);
    return transformToolCase(response);
  },

  /**
   * Update a tool case
   */
  async update(id: string, data: Partial<ToolCase>): Promise<ToolCase> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.put<ToolCaseResponse>(`/tool-cases/${id}`, request);
    return transformToolCase(response);
  },

  /**
   * Delete a tool case
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tool-cases/${id}`);
  },

  /**
   * Get tools in a specific case
   */
  async getTools(caseId: string): Promise<Tool[]> {
    const response = await apiClient.get<ToolResponse[]>(`/tool-cases/${caseId}/tools`);
    return transformTools(response);
  },

  /**
   * Convert a case to a tool. Soft-deletes the case and returns the new tool.
   */
  async convertToTool(caseId: string): Promise<Tool> {
    const response = await apiClient.post<ToolResponse>(`/tool-cases/${caseId}/convert-to-tool`, {});
    return transformTool(response);
  },
};

// =============================================================================
// TOOLS
// =============================================================================

export const toolsService = {
  /**
   * Get all tools
   */
  async getAll(params?: ToolListParams): Promise<Tool[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
      status: params?.status,
      condition: params?.condition,
      category_id: params?.category_id,
      case_id: params?.case_id,
      location_id: params?.location_id,
      calibration_required: params?.calibration_required,
    };

    const response = await apiClient.get<ToolResponse[]>("/tools", {
      params: queryParams,
    });

    return transformTools(response);
  },

  /**
   * Get tool by ID
   */
  async getById(id: string): Promise<Tool> {
    const response = await apiClient.get<ToolResponse>(`/tools/${id}`);
    return transformTool(response);
  },

  /**
   * Get tool by ERP code
   */
  async getByErpCode(erpCode: string): Promise<Tool> {
    const response = await apiClient.get<ToolResponse>(`/tools/by-erp-code/${erpCode}`);
    return transformTool(response);
  },

  /**
   * Get tools by category
   */
  async getByCategory(categoryId: string): Promise<Tool[]> {
    const response = await apiClient.get<ToolResponse[]>(`/tools`, {
      params: { category_id: categoryId },
    });
    return transformTools(response);
  },

  /**
   * Get tools not assigned to any case
   */
  async getUnassigned(): Promise<Tool[]> {
    const response = await apiClient.get<ToolResponse[]>("/tools", {
      params: { unassigned: true },
    });
    return transformTools(response);
  },

  /**
   * Get tools by case
   */
  async getByCase(caseId: string): Promise<Tool[]> {
    const response = await apiClient.get<ToolResponse[]>(`/tools`, {
      params: { case_id: caseId },
    });
    return transformTools(response);
  },

  /**
   * Create a new tool
   */
  async create(data: Partial<Tool>): Promise<Tool> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ToolResponse>("/tools", request);
    return transformTool(response);
  },

  /**
   * Update a tool
   */
  async update(id: string, data: Partial<Tool>): Promise<Tool> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.put<ToolResponse>(`/tools/${id}`, request);
    return transformTool(response);
  },

  /**
   * Delete a tool
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tools/${id}`);
  },

  /**
   * Convert a tool to a case. Soft-deletes the tool and returns the new case.
   */
  async convertToCase(toolId: string): Promise<ToolCase> {
    const response = await apiClient.post<ToolCaseResponse>(`/tools/${toolId}/convert-to-case`, {});
    return transformToolCase(response);
  },
};

// =============================================================================
// TOOL ASSIGNMENTS
// =============================================================================

export const toolAssignmentsService = {
  /**
   * Get all tool assignments
   */
  async getAll(params?: ToolAssignmentListParams): Promise<ToolAssignment[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      tool_id: params?.tool_id,
      case_id: params?.case_id,
      employee_id: params?.employee_id,
      vehicle_id: params?.vehicle_id,
      active_only: params?.active_only,
    };

    const response = await apiClient.get<ToolAssignmentResponse[]>("/tool-assignments", {
      params: queryParams,
    });

    return transformToolAssignments(response);
  },

  /**
   * Get active assignments only
   */
  async getActive(): Promise<ToolAssignment[]> {
    const response = await apiClient.get<ToolAssignmentResponse[]>("/tool-assignments", {
      params: { active_only: true },
    });
    return transformToolAssignments(response);
  },

  /**
   * Get assignment by ID
   */
  async getById(id: string): Promise<ToolAssignment> {
    const response = await apiClient.get<ToolAssignmentResponse>(`/tool-assignments/${id}`);
    return transformToolAssignment(response);
  },

  /**
   * Create a new tool assignment (checkout)
   */
  async create(data: Partial<ToolAssignment>): Promise<ToolAssignment> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ToolAssignmentResponse>("/tool-assignments", request);
    return transformToolAssignment(response);
  },

  /**
   * Return a tool (complete the assignment)
   */
  async returnTool(id: string, data: { condition_at_return?: string; notes?: string }): Promise<ToolAssignment> {
    const response = await apiClient.put<ToolAssignmentResponse>(`/tool-assignments/${id}/return`, data);
    return transformToolAssignment(response);
  },

  /**
   * Get assignments by employee
   */
  async getByEmployee(employeeId: string): Promise<ToolAssignment[]> {
    const response = await apiClient.get<ToolAssignmentResponse[]>("/tool-assignments", {
      params: { employee_id: employeeId },
    });
    return transformToolAssignments(response);
  },

  /**
   * Get assignments by vehicle
   */
  async getByVehicle(vehicleId: string): Promise<ToolAssignment[]> {
    const response = await apiClient.get<ToolAssignmentResponse[]>("/tool-assignments", {
      params: { vehicle_id: vehicleId },
    });
    return transformToolAssignments(response);
  },

  /**
   * Delete an assignment
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tool-assignments/${id}`);
  },
};

// =============================================================================
// TOOL CALIBRATIONS
// =============================================================================

export const toolCalibrationsService = {
  /**
   * Get all calibrations
   */
  async getAll(params?: ToolCalibrationListParams): Promise<ToolCalibration[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      tool_id: params?.tool_id,
    };

    const response = await apiClient.get<ToolCalibrationResponse[]>("/tool-calibrations", {
      params: queryParams,
    });

    return transformToolCalibrations(response);
  },

  /**
   * Get calibration by ID
   */
  async getById(id: string): Promise<ToolCalibration> {
    const response = await apiClient.get<ToolCalibrationResponse>(`/tool-calibrations/${id}`);
    return transformToolCalibration(response);
  },

  /**
   * Create a new calibration record
   */
  async create(data: Partial<ToolCalibration>): Promise<ToolCalibration> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ToolCalibrationResponse>("/tool-calibrations", request);
    return transformToolCalibration(response);
  },

  /**
   * Update a calibration record
   */
  async update(id: string, data: Partial<ToolCalibration>): Promise<ToolCalibration> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.put<ToolCalibrationResponse>(`/tool-calibrations/${id}`, request);
    return transformToolCalibration(response);
  },

  /**
   * Delete a calibration record
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tool-calibrations/${id}`);
  },
};

// =============================================================================
// CONSUMABLES
// =============================================================================

export const consumablesService = {
  async getAll(params?: ConsumableListParams): Promise<Consumable[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      case_id: params?.case_id,
      status: params?.status,
      category_id: params?.category_id,
      location_id: params?.location_id,
      low_stock_only: params?.low_stock_only,
    };
    const response = await apiClient.get<ConsumableResponse[]>("/consumables", { params: queryParams });
    return transformConsumables(response);
  },

  async getById(id: string): Promise<Consumable> {
    const response = await apiClient.get<ConsumableResponse>(`/consumables/${id}`);
    return transformConsumable(response);
  },

  async getByCase(caseId: string): Promise<Consumable[]> {
    const response = await apiClient.get<ConsumableResponse[]>("/consumables", {
      params: { case_id: caseId },
    });
    return transformConsumables(response);
  },

  async getLowStock(): Promise<Consumable[]> {
    const response = await apiClient.get<ConsumableResponse[]>("/consumables", {
      params: { low_stock_only: true },
    });
    return transformConsumables(response);
  },

  async create(data: Partial<Consumable>): Promise<Consumable> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.post<ConsumableResponse>("/consumables", request);
    return transformConsumable(response);
  },

  async update(id: string, data: Partial<Consumable>): Promise<Consumable> {
    const request = toSnakeCase(data as Record<string, unknown>);
    const response = await apiClient.put<ConsumableResponse>(`/consumables/${id}`, request);
    return transformConsumable(response);
  },

  async adjustQuantity(id: string, delta: number, notes?: string): Promise<Consumable> {
    const response = await apiClient.post<ConsumableResponse>(
      `/consumables/${id}/adjust-quantity`,
      { delta, notes }
    );
    return transformConsumable(response);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/consumables/${id}`);
  },
};
