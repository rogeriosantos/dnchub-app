"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { maintenanceService, vehiclesService } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { MaintenanceTask, MaintenanceStatus, MaintenanceType, Vehicle } from "@/types";

// Status badge config (icons and variants only, labels from translations)
const maintenanceStatusConfig: Record<MaintenanceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: { variant: "secondary", icon: Calendar },
  in_progress: { variant: "default", icon: Clock },
  completed: { variant: "outline", icon: CheckCircle },
  overdue: { variant: "destructive", icon: AlertTriangle },
  cancelled: { variant: "outline", icon: Wrench },
};

// Maintenance type values
const maintenanceTypeValues: MaintenanceType[] = ["preventive", "corrective", "inspection", "recall", "emergency"];

export default function MaintenancePage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = React.useState<MaintenanceTask[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [deleteDialogTaskId, setDeleteDialogTaskId] = React.useState<string | null>(null);

  // Handler to start a task
  const handleStartTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      const updated = await maintenanceService.update(taskId, { status: "in_progress" });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      console.error("Failed to start task:", err);
      toast.error(t('maintenance.errors.failedToStart'));
    } finally {
      setActionLoading(null);
    }
  };

  // Handler to complete a task
  const handleCompleteTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      const updated = await maintenanceService.complete(taskId);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      console.error("Failed to complete task:", err);
      toast.error(t('maintenance.errors.failedToComplete'));
    } finally {
      setActionLoading(null);
    }
  };

  // Handler to delete a task (called after dialog confirmation)
  const handleDeleteTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      await maintenanceService.delete(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error(t('maintenance.errors.failedToDelete'));
    } finally {
      setActionLoading(null);
    }
  };

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
        console.error("Failed to load maintenance data:", err);
        setError(t('maintenance.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculate stats
  const scheduledCount = tasks.filter((t) => t.status === "scheduled").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const overdueCount = tasks.filter((t) => t.status === "overdue").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalEstimatedCost = tasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .reduce((sum, t) => sum + (Number(t.estimatedCost) || 0), 0);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const vehicle = vehicles.find((v) => v.id === task.vehicleId);

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      vehicle?.registrationPlate.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">{t('maintenance.title')}</h1>
          <p className="text-muted-foreground">
            {t('maintenance.subtitle')}
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('maintenance.scheduleMaintenance')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledCount}</p>
                <p className="text-xs text-muted-foreground">{t('maintenance.stats.scheduled')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">{t('maintenance.stats.inProgress')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">{t('maintenance.stats.overdue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">{t('maintenance.stats.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalEstimatedCost)}</p>
                <p className="text-xs text-muted-foreground">{t('maintenance.stats.estimatedCost')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('maintenance.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('maintenance.filter.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('maintenance.filter.allStatuses')}</SelectItem>
                  {Object.keys(maintenanceStatusConfig).map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`maintenance.status.${status === 'in_progress' ? 'inProgress' : status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('maintenance.filter.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('maintenance.filter.allTypes')}</SelectItem>
                  {maintenanceTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`maintenance.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('maintenance.table.task')}</TableHead>
                  <TableHead>{t('maintenance.table.vehicle')}</TableHead>
                  <TableHead>{t('maintenance.table.type')}</TableHead>
                  <TableHead>{t('maintenance.table.status')}</TableHead>
                  <TableHead>{t('maintenance.table.scheduledDate')}</TableHead>
                  <TableHead className="text-right">{t('maintenance.table.estimatedCost')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Wrench className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('maintenance.noTasks')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => {
                    const vehicle = vehicles.find((v) => v.id === task.vehicleId);
                    const StatusIcon = maintenanceStatusConfig[task.status].icon;
                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Link
                            href={`/fleet/maintenance/${task.id}`}
                            className="font-medium hover:underline"
                          >
                            {task.title}
                          </Link>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {task.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle ? (
                            <Link
                              href={`/fleet/vehicles/${vehicle.id}`}
                              className="hover:underline"
                            >
                              {vehicle.registrationPlate}
                            </Link>
                          ) : (
                            t('common.unknown')
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`maintenance.types.${task.type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={maintenanceStatusConfig[task.status].variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {t(`maintenance.status.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.scheduledDate ? formatDate(task.scheduledDate) : t('common.notScheduled')}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {task.estimatedCost ? formatCurrency(task.estimatedCost) : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('maintenance.actions.openMenu')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/maintenance/${task.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('maintenance.actions.viewDetails')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/maintenance/${task.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('maintenance.actions.editTask')}
                                </Link>
                              </DropdownMenuItem>
                              {task.status === "scheduled" && (
                                <DropdownMenuItem
                                  onClick={() => handleStartTask(task.id)}
                                  disabled={actionLoading === task.id}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  {actionLoading === task.id ? t('maintenance.actions.starting') : t('maintenance.actions.startTask')}
                                </DropdownMenuItem>
                              )}
                              {task.status === "in_progress" && (
                                <DropdownMenuItem
                                  onClick={() => handleCompleteTask(task.id)}
                                  disabled={actionLoading === task.id}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {actionLoading === task.id ? t('maintenance.actions.completing') : t('maintenance.actions.markComplete')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialogTaskId(task.id)}
                                disabled={actionLoading === task.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {actionLoading === task.id ? t('maintenance.actions.deleting') : t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogTaskId !== null} onOpenChange={(open) => { if (!open) setDeleteDialogTaskId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('maintenance.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('maintenance.deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDialogTaskId) {
                  handleDeleteTask(deleteDialogTaskId);
                  setDeleteDialogTaskId(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
