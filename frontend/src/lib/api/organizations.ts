/**
 * Organizations API service
 */

import { apiClient } from "./client";
import type { OrganizationApiResponse, OrganizationUpdateRequest } from "./types";
import { transformOrganization } from "./transformers";
import type { Organization } from "@/types";

export const organizationsService = {
  /**
   * Get current user's organization
   */
  async getCurrent(): Promise<Organization> {
    const response = await apiClient.get<OrganizationApiResponse>("/organizations/me");
    return transformOrganization(response);
  },

  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<Organization> {
    const response = await apiClient.get<OrganizationApiResponse>(`/organizations/${id}`);
    return transformOrganization(response);
  },

  /**
   * Update organization
   */
  async update(id: string, data: OrganizationUpdateRequest): Promise<Organization> {
    const response = await apiClient.patch<OrganizationApiResponse>(`/organizations/${id}`, data);
    return transformOrganization(response);
  },

  /**
   * Update current user's organization
   */
  async updateCurrent(data: OrganizationUpdateRequest): Promise<Organization> {
    // First get the current organization to get its ID
    const current = await this.getCurrent();
    return this.update(current.id, data);
  },
};

export default organizationsService;
