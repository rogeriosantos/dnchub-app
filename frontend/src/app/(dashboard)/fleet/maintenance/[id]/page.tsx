"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Wrench,
  Truck,
  Calendar,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Gauge,
} from "lucide-react";
import { maintenanceService, vehiclesService } from "@/lib/api";
import { formatDate, formatCurrency, formatDistance, cn } from "@/lib/utils";
import type { MaintenanceTask, MaintenanceStatus, MaintenanceType, Vehicle } from "@/types";

// Status badge config
const maintenanceStatusConfig: Record<MaintenanceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string; bgColor: string }> = {
  scheduled: { variant: "secondary", label: "Scheduled", color: "text-blue-700", bgColor: "bg-blue-100" },
  in_progress: { variant: "default", label: "In Progress", color: "text-amber-700", bgColor: "bg-amber-100" },
  completed: { variant: "outline", label: "Completed", color: "text-green-700", bgColor: "bg-green-100" },
  overdue: { variant: "destructive", label: "Overdue", color: "text-red-700", bgColor: "bg-red-100" },
  cancelled: { variant: "outline", label: "Cancelled", color: "text-gray-700", bgColor: "bg-gray-100" },
};

const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  preventive: "Preventive",
  corrective: "Corrective",
  inspection: "Inspection",
  recall: "Recall",
  emergency: "Emergency",
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = React.useState<MaintenanceTask | null>(null);
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const taskData = await maintenanceService.getById(taskId);
        setTask(taskData);

        // Load vehicle data if task has a vehicleId
        if (taskData.vehicleId) {
          try {
            const vehicleData = await vehiclesService.getById(taskData.vehicleId);
            setVehicle(vehicleData);
          } catch (err) {
            console.error("Failed to load vehicle:", err);
            // Vehicle might not exist or user might not have access
          }
        }
      } catch (err) {
        console.error("Failed to load maintenance task:", err);
        setError("Task not found or failed to load.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [taskId]);

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await maintenanceService.delete(taskId);
      router.push("/fleet/maintenance");
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task. Please try again.");
      setIsDeleting(false);
    }
  };

  // Handle start task
  const handleStartTask = async () => {
    if (!task) return;
    try {
      const updated = await maintenanceService.update(taskId, { status: "in_progress" });
      setTask(updated);
    } catch (err) {
      console.error("Failed to start task:", err);
      alert("Failed to start task. Please try again.");
    }
  };

  // Handle complete task
  const handleCompleteTask = async () => {
    if (!task) return;
    try {
      const updated = await maintenanceService.complete(taskId);
      setTask(updated);
    } catch (err) {
      console.error("Failed to complete task:", err);
      alert("Failed to complete task. Please try again.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {error ? (
          <AlertCircle className="h-12 w-12 text-destructive" />
        ) : (
          <Wrench className="h-12 w-12 text-muted-foreground" />
        )}
        <h2 className="mt-4 text-xl font-semibold">
          {error ? "Error" : "Task Not Found"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {error || "The maintenance task you're looking for doesn't exist."}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/maintenance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Maintenance
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = maintenanceStatusConfig[task.status];

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/maintenance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {vehicle?.registrationPlate || "Unknown Vehicle"} • {maintenanceTypeLabels[task.type]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {task.status === "scheduled" && (
            <Button variant="outline" onClick={handleStartTask}>
              <Clock className="mr-2 h-4 w-4" />
              Start Task
            </Button>
          )}
          {task.status === "in_progress" && (
            <Button variant="outline" onClick={handleCompleteTask}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/fleet/maintenance/${taskId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this maintenance task. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", statusConfig.bgColor)}>
                <Wrench className={cn("h-5 w-5", statusConfig.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{statusConfig.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="font-semibold">
                  {task.scheduledDate ? formatDate(task.scheduledDate) : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="font-semibold tabular-nums">
                  {task.estimatedCost ? formatCurrency(task.estimatedCost) : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actual Cost</p>
                <p className="font-semibold tabular-nums">
                  {task.actualCost ? formatCurrency(task.actualCost) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Maintenance task information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{task.description || "No description provided"}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1">
                  {maintenanceTypeLabels[task.type]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge
                  variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}
                  className="mt-1 capitalize"
                >
                  {task.priority || "Normal"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">
                  {task.scheduledDate ? formatDate(task.scheduledDate) : "Not scheduled"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Date</p>
                <p className="font-medium">
                  {task.completedDate ? formatDate(task.completedDate) : "—"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Odometer at Service</p>
                <p className="font-medium tabular-nums">
                  {task.completedOdometer ? formatDistance(task.completedOdometer) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Provider</p>
                <p className="font-medium">{task.serviceProvider || "Not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
            <CardDescription>Associated vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicle ? (
              <Link
                href={`/fleet/vehicles/${vehicle.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                  <Truck className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{vehicle.registrationPlate}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Odometer: {formatDistance(vehicle.currentOdometer)}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {vehicle.status.replace("_", " ")}
                </Badge>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                <Truck className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 font-medium">Vehicle Not Found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Estimated and actual costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Parts</span>
                <span className="font-medium tabular-nums">
                  {task.partsCost ? formatCurrency(task.partsCost) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Labor</span>
                <span className="font-medium tabular-nums">
                  {task.laborCost ? formatCurrency(task.laborCost) : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estimated Total</span>
                <span className="font-bold tabular-nums">
                  {task.estimatedCost ? formatCurrency(task.estimatedCost) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Actual Total</span>
                <span className="font-bold tabular-nums text-green-600">
                  {task.actualCost ? formatCurrency(task.actualCost) : "—"}
                </span>
              </div>
            </div>

            {task.estimatedCost && task.actualCost && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Budget Variance</span>
                  <span
                    className={cn(
                      "font-medium",
                      task.actualCost <= task.estimatedCost ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {task.actualCost <= task.estimatedCost ? "Under" : "Over"} budget by{" "}
                    {formatCurrency(Math.abs(task.actualCost - task.estimatedCost))}
                  </span>
                </div>
                <Progress
                  value={(task.actualCost / task.estimatedCost) * 100}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Documents</CardTitle>
            <CardDescription>Additional information and attachments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              {task.notes ? (
                <p className="text-sm">{task.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes added</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Documents</p>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No documents attached</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Upload Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
