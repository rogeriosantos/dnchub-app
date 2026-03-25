/**
 * Notification Preferences API Service
 */

import type { NotificationPreferences, NotificationSettingItem } from "@/types";
import { apiClient } from "./client";
import type {
  NotificationPreferencesApiResponse,
  NotificationPreferencesUpdateRequest,
  ChannelsUpdateRequest,
  QuietHoursUpdateRequest,
  NotificationSettingUpdateRequest,
} from "./types";
import { transformNotificationPreferences } from "./transformers";

export const notificationPreferencesService = {
  /**
   * Get notification preferences for the current user
   */
  async get(): Promise<NotificationPreferences> {
    const response = await apiClient.get<NotificationPreferencesApiResponse>("/notification-preferences");
    return transformNotificationPreferences(response);
  },

  /**
   * Update notification preferences
   */
  async update(data: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    emailAddress?: string;
    phoneNumber?: string;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    notificationSettings?: Record<string, NotificationSettingItem>;
  }): Promise<NotificationPreferences> {
    const request: NotificationPreferencesUpdateRequest = {
      email_enabled: data.emailEnabled,
      push_enabled: data.pushEnabled,
      sms_enabled: data.smsEnabled,
      email_address: data.emailAddress,
      phone_number: data.phoneNumber,
      quiet_hours_enabled: data.quietHoursEnabled,
      quiet_hours_start: data.quietHoursStart,
      quiet_hours_end: data.quietHoursEnd,
      notification_settings: data.notificationSettings,
    };

    const response = await apiClient.put<NotificationPreferencesApiResponse>("/notification-preferences", request);
    return transformNotificationPreferences(response);
  },

  /**
   * Update notification channel settings only
   */
  async updateChannels(data: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    emailAddress?: string;
    phoneNumber?: string;
  }): Promise<NotificationPreferences> {
    const request: ChannelsUpdateRequest = {
      email_enabled: data.emailEnabled,
      push_enabled: data.pushEnabled,
      sms_enabled: data.smsEnabled,
      email_address: data.emailAddress,
      phone_number: data.phoneNumber,
    };

    const response = await apiClient.put<NotificationPreferencesApiResponse>("/notification-preferences/channels", request);
    return transformNotificationPreferences(response);
  },

  /**
   * Update quiet hours settings
   */
  async updateQuietHours(data: {
    enabled: boolean;
    start?: string;
    end?: string;
  }): Promise<NotificationPreferences> {
    const request: QuietHoursUpdateRequest = {
      enabled: data.enabled,
      start: data.start,
      end: data.end,
    };

    const response = await apiClient.put<NotificationPreferencesApiResponse>("/notification-preferences/quiet-hours", request);
    return transformNotificationPreferences(response);
  },

  /**
   * Update a single notification type setting
   */
  async updateNotificationSetting(data: {
    notificationKey: string;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  }): Promise<NotificationPreferences> {
    const request: NotificationSettingUpdateRequest = {
      notification_key: data.notificationKey,
      email: data.email,
      push: data.push,
      sms: data.sms,
    };

    const response = await apiClient.put<NotificationPreferencesApiResponse>("/notification-preferences/setting", request);
    return transformNotificationPreferences(response);
  },

  /**
   * Reset all preferences to defaults
   */
  async reset(): Promise<NotificationPreferences> {
    const response = await apiClient.post<NotificationPreferencesApiResponse>("/notification-preferences/reset");
    return transformNotificationPreferences(response);
  },
};
