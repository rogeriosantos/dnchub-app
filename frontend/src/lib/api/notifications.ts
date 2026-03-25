/**
 * Notifications API Service
 */

import type { Notification } from "@/types";
import { apiClient } from "./client";
import type { NotificationApiResponse, NotificationListParams } from "./types";
import { transformNotification, transformNotifications } from "./transformers";

export const notificationsService = {
  /**
   * Get all notifications for the current user
   */
  async getAll(params?: NotificationListParams): Promise<Notification[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      unread_only: params?.unread_only,
      notification_type: params?.notification_type,
    };

    const response = await apiClient.get<NotificationApiResponse[]>("/notifications", {
      params: queryParams,
    });
    return transformNotifications(response);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unread_count: number }>("/notifications/unread-count");
    return response.unread_count;
  },

  /**
   * Get high priority notifications (unread warnings and errors)
   */
  async getHighPriority(): Promise<Notification[]> {
    const response = await apiClient.get<NotificationApiResponse[]>("/notifications/high-priority");
    return transformNotifications(response);
  },

  /**
   * Get a notification by ID
   */
  async getById(id: string): Promise<Notification> {
    const response = await apiClient.get<NotificationApiResponse>(`/notifications/${id}`);
    return transformNotification(response);
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.post<NotificationApiResponse>(`/notifications/${id}/read`);
    return transformNotification(response);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    const response = await apiClient.post<{ marked_count: number }>("/notifications/mark-all-read");
    return response.marked_count;
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Delete old notifications
   */
  async deleteOld(daysOld: number = 90): Promise<number> {
    const response = await apiClient.delete<{ deleted_count: number }>("/notifications/old", {
      params: { days_old: daysOld },
    });
    return response.deleted_count;
  },
};
