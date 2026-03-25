"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Truck,
  Clock,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { maintenanceService, vehiclesService } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MaintenanceTask, MaintenanceStatus, Vehicle } from "@/types";

const statusColors: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

// Generate calendar data
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  // Add empty slots for days before the first day
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i);
  }

  return days;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MaintenanceSchedulePage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = React.useState<MaintenanceTask[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"month" | "week">("month");

  // Load data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [tasksData, vehiclesData] = await Promise.all([
          maintenanceService.getAll({ limit: 500 }),
          vehiclesService.getAll({ limit: 500 }),
        ]);

        setTasks(tasksData);
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Failed to load schedule data:", err);
        setError(t('maintenance.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = generateCalendarDays(year, month);

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  // Get tasks for a specific day
  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((task) => task.scheduledDate?.startsWith(dateStr));
  };

  const upcomingTasks = tasks
    .filter((t) => t.status === "scheduled" || t.status === "overdue")
    .slice(0, 5);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">{t('maintenance.errors.loadFailed')}</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('maintenance.scheduleTitle')}</h1>
          <p className="text-muted-foreground">
            {t('maintenance.scheduleSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('common.view')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t('maintenance.calendar.month')}</SelectItem>
              <SelectItem value="week">{t('maintenance.calendar.week')}</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/fleet/maintenance/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('maintenance.scheduleTask')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {months[month]} {year}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  {t('maintenance.calendar.today')}
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Header */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {/* Days */}
              {days.map((day, index) => {
                const tasks = day ? getTasksForDay(day) : [];
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[80px] rounded-lg border p-1",
                      day ? "bg-card" : "bg-muted/30",
                      isToday && "border-primary"
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                          isToday && "bg-primary text-primary-foreground"
                        )}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {tasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className={cn(
                                "truncate rounded px-1 text-xs",
                                statusColors[task.status]
                              )}
                            >
                              {task.title}
                            </div>
                          ))}
                          {tasks.length > 2 && (
                            <div className="text-xs text-muted-foreground px-1">
                              {t('maintenance.calendar.moreItems', { count: tasks.length - 2 })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('maintenance.calendar.thisMonth')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('maintenance.stats.scheduled')}</span>
                <Badge variant="secondary">
                  {tasks.filter((task) => task.status === "scheduled").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('maintenance.stats.inProgress')}</span>
                <Badge variant="default">
                  {tasks.filter((task) => task.status === "in_progress").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('maintenance.stats.overdue')}</span>
                <Badge variant="destructive">
                  {tasks.filter((task) => task.status === "overdue").length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('maintenance.calendar.upcomingTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const vehicle = vehicles.find((v) => v.id === task.vehicleId);
                  return (
                    <Link
                      key={task.id}
                      href={`/maintenance/${task.id}`}
                      className="block rounded-lg border p-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {task.status === "overdue" ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        ) : (
                          <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle?.registrationPlate}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {task.scheduledDate}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
