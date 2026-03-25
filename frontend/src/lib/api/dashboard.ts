/**
 * Dashboard API service
 */

import { apiClient } from "./client";
import type { DashboardStatsResponse, VehicleStatusCount } from "./types";
import { transformDashboardStats } from "./transformers";
import type { DashboardMetrics } from "@/types";

export interface RecentActivity {
  id: string;
  type: "vehicle" | "driver" | "maintenance" | "fuel";
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
}

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<Partial<DashboardMetrics>> {
    const response = await apiClient.get<DashboardStatsResponse>("/dashboard/stats");
    return transformDashboardStats(response);
  },

  /**
   * Get vehicle status distribution
   */
  async getVehicleStatusDistribution(): Promise<VehicleStatusCount[]> {
    const response = await apiClient.get<VehicleStatusCount[]>(
      "/dashboard/vehicle-status-distribution"
    );
    return response;
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await apiClient.get<RecentActivity[]>("/dashboard/recent-activity", {
      params: { limit },
    });
    return response;
  },

  /**
   * Get fuel cost trend (monthly)
   */
  async getFuelCostTrend(months: number = 6): Promise<{ month: string; cost: number }[]> {
    const response = await apiClient.get<{ month: string; cost: number }[]>(
      "/dashboard/fuel-cost-trend",
      { params: { months } }
    );
    return response;
  },

  /**
   * Get maintenance summary
   */
  async getMaintenanceSummary(): Promise<{
    scheduled: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const response = await apiClient.get<{
      scheduled: number;
      in_progress: number;
      completed: number;
      overdue: number;
    }>("/dashboard/maintenance-summary");

    return {
      scheduled: response.scheduled,
      inProgress: response.in_progress,
      completed: response.completed,
      overdue: response.overdue,
    };
  },
};

export default dashboardService;
