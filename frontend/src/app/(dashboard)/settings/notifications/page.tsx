"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  AlertTriangle,
  Wrench,
  Fuel,
  MapPin,
  Calendar,
  DollarSign,
  Save,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { notificationPreferencesService } from "@/lib/api";
import type { NotificationPreferences, NotificationSettingItem } from "@/types";
import { useAuth } from "@/contexts";
import { toast } from "sonner";

// Notification categories definition
const notificationCategories = [
  {
    id: "vehicles",
    name: "Vehicle Alerts",
    icon: AlertTriangle,
    description: "Vehicle status changes and issues",
    notifications: [
      { id: "vehicle_status", label: "Vehicle status changes" },
      { id: "vehicle_assignment", label: "Driver assignment changes" },
      { id: "vehicle_inspection", label: "Inspection due reminders" },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: Wrench,
    description: "Service and repair notifications",
    notifications: [
      { id: "maint_due", label: "Scheduled maintenance due" },
      { id: "maint_overdue", label: "Overdue maintenance alerts" },
      { id: "maint_completed", label: "Service completed" },
      { id: "work_order", label: "Work order updates" },
    ],
  },
  {
    id: "fuel",
    name: "Fuel & Expenses",
    icon: Fuel,
    description: "Fuel and expense notifications",
    notifications: [
      { id: "fuel_transaction", label: "New fuel transactions" },
      { id: "fuel_anomaly", label: "Unusual fuel consumption" },
      { id: "expense_approval", label: "Expense approval required" },
    ],
  },
  {
    id: "gps",
    name: "GPS & Tracking",
    icon: MapPin,
    description: "Location and geofence alerts",
    notifications: [
      { id: "geofence_enter", label: "Geofence entry" },
      { id: "geofence_exit", label: "Geofence exit" },
      { id: "speed_alert", label: "Speed limit exceeded" },
      { id: "idle_alert", label: "Extended idle time" },
    ],
  },
  {
    id: "compliance",
    name: "Compliance",
    icon: Calendar,
    description: "License and document expiry alerts",
    notifications: [
      { id: "license_expiry", label: "License expiring soon" },
      { id: "insurance_expiry", label: "Insurance expiring soon" },
      { id: "registration_expiry", label: "Registration expiring" },
    ],
  },
  {
    id: "financial",
    name: "Financial",
    icon: DollarSign,
    description: "Budget and cost alerts",
    notifications: [
      { id: "budget_threshold", label: "Budget threshold reached" },
      { id: "cost_anomaly", label: "Unusual cost patterns" },
      { id: "report_ready", label: "Scheduled report ready" },
    ],
  },
];

// Default settings for when a notification type doesn't exist in the database
const defaultSetting: NotificationSettingItem = { email: true, push: true, sms: false };

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Local state for form values
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [smsEnabled, setSmsEnabled] = React.useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(false);
  const [quietHoursStart, setQuietHoursStart] = React.useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = React.useState("07:00");
  const [notificationSettings, setNotificationSettings] = React.useState<Record<string, NotificationSettingItem>>({});

  // Fetch preferences on mount
  React.useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const prefs = await notificationPreferencesService.get();
        setPreferences(prefs);

        // Set local state from fetched preferences
        setEmailEnabled(prefs.emailEnabled);
        setPushEnabled(prefs.pushEnabled);
        setSmsEnabled(prefs.smsEnabled);
        setQuietHoursEnabled(prefs.quietHoursEnabled);
        setQuietHoursStart(prefs.quietHoursStart);
        setQuietHoursEnd(prefs.quietHoursEnd);
        setNotificationSettings(prefs.notificationSettings);
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
        toast.error("Failed to load notification preferences");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Track changes
  React.useEffect(() => {
    if (!preferences) return;

    const hasChange =
      emailEnabled !== preferences.emailEnabled ||
      pushEnabled !== preferences.pushEnabled ||
      smsEnabled !== preferences.smsEnabled ||
      quietHoursEnabled !== preferences.quietHoursEnabled ||
      quietHoursStart !== preferences.quietHoursStart ||
      quietHoursEnd !== preferences.quietHoursEnd ||
      JSON.stringify(notificationSettings) !== JSON.stringify(preferences.notificationSettings);

    setHasChanges(hasChange);
  }, [preferences, emailEnabled, pushEnabled, smsEnabled, quietHoursEnabled, quietHoursStart, quietHoursEnd, notificationSettings]);

  const toggleNotification = (id: string, channel: "email" | "push" | "sms") => {
    setNotificationSettings((prev) => {
      const current = prev[id] || { ...defaultSetting };
      return {
        ...prev,
        [id]: {
          ...current,
          [channel]: !current[channel],
        },
      };
    });
  };

  const getNotificationSetting = (id: string): NotificationSettingItem => {
    return notificationSettings[id] || defaultSetting;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await notificationPreferencesService.update({
        emailEnabled,
        pushEnabled,
        smsEnabled,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        notificationSettings,
      });
      setPreferences(updated);
      setHasChanges(false);
      toast.success("Notification preferences saved successfully");
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const reset = await notificationPreferencesService.reset();
      setPreferences(reset);
      setEmailEnabled(reset.emailEnabled);
      setPushEnabled(reset.pushEnabled);
      setSmsEnabled(reset.smsEnabled);
      setQuietHoursEnabled(reset.quietHoursEnabled);
      setQuietHoursStart(reset.quietHoursStart);
      setQuietHoursEnd(reset.quietHoursEnd);
      setNotificationSettings(reset.notificationSettings);
      setHasChanges(false);
      toast.success("Notification preferences reset to defaults");
    } catch (error) {
      console.error("Failed to reset notification preferences:", error);
      toast.error("Failed to reset notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Configure how and when you receive alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
              </div>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Browser and mobile app</p>
              </div>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">{user?.phone || "No phone number"}</p>
              </div>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {quietHoursEnabled ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause non-urgent notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Quiet Hours</Label>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>
          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={quietHoursStart}
                  onValueChange={setQuietHoursStart}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20:00">8:00 PM</SelectItem>
                    <SelectItem value="21:00">9:00 PM</SelectItem>
                    <SelectItem value="22:00">10:00 PM</SelectItem>
                    <SelectItem value="23:00">11:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  value={quietHoursEnd}
                  onValueChange={setQuietHoursEnd}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Critical alerts (vehicle emergencies, system errors) will still be delivered.
          </p>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      {notificationCategories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              {category.name}
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header Row */}
              <div className="grid grid-cols-[1fr,80px,80px,80px] items-center gap-4 text-sm font-medium text-muted-foreground">
                <div>Notification</div>
                <div className="text-center">Email</div>
                <div className="text-center">Push</div>
                <div className="text-center">SMS</div>
              </div>
              <Separator />
              {/* Notification Rows */}
              {category.notifications.map((notification) => {
                const settings = getNotificationSetting(notification.id);
                return (
                  <div
                    key={notification.id}
                    className="grid grid-cols-[1fr,80px,80px,80px] items-center gap-4"
                  >
                    <Label htmlFor={notification.id} className="text-sm">
                      {notification.label}
                    </Label>
                    <div className="flex justify-center">
                      <Switch
                        checked={settings.email}
                        onCheckedChange={() =>
                          toggleNotification(notification.id, "email")
                        }
                        disabled={!emailEnabled}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={settings.push}
                        onCheckedChange={() =>
                          toggleNotification(notification.id, "push")
                        }
                        disabled={!pushEnabled}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={settings.sms}
                        onCheckedChange={() =>
                          toggleNotification(notification.id, "sms")
                        }
                        disabled={!smsEnabled}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isSaving}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save All Preferences
        </Button>
      </div>
    </div>
  );
}
