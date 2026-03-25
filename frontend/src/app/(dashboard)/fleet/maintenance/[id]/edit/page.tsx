"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { maintenanceService, vehiclesService } from "@/lib/api";
import type { MaintenanceTask, MaintenanceType, MaintenancePriority, MaintenanceStatus, Vehicle } from "@/types";

const maintenanceTypes: { value: MaintenanceType; label: string }[] = [
  { value: "preventive", label: "Preventive" },
  { value: "corrective", label: "Corrective" },
  { value: "inspection", label: "Inspection" },
  { value: "recall", label: "Recall" },
  { value: "emergency", label: "Emergency" },
];

const priorities: { value: MaintenancePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const statuses: { value: MaintenanceStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditMaintenancePage({ params }: PageProps) {
  const router = useRouter();
  const [task, setTask] = React.useState<MaintenanceTask | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [taskId, setTaskId] = React.useState<string>("");

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    type: "" as MaintenanceType | "",
    priority: "medium" as MaintenancePriority,
    status: "scheduled" as MaintenanceStatus,
    vehicleId: "",
    scheduledDate: "",
    estimatedCost: "",
    actualCost: "",
    laborCost: "",
    partsCost: "",
    serviceProvider: "",
    serviceProviderContact: "",
    assignedTo: "",
    notes: "",
  });

  React.useEffect(() => {
    params.then((p) => setTaskId(p.id));
  }, [params]);

  React.useEffect(() => {
    if (!taskId) return;
    async function loadData() {
      try {
        setIsLoading(true);
        const [taskData, vehiclesData] = await Promise.all([
          maintenanceService.getById(taskId),
          vehiclesService.getAll({ limit: 500 }),
        ]);
        setTask(taskData);
        setVehicles(vehiclesData);
        setFormData({
          title: taskData.title,
          description: taskData.description || "",
          type: taskData.type,
          priority: taskData.priority,
          status: taskData.status,
          vehicleId: taskData.vehicleId,
          scheduledDate: taskData.scheduledDate || "",
          estimatedCost: taskData.estimatedCost?.toString() || "",
          actualCost: taskData.actualCost?.toString() || "",
          laborCost: taskData.laborCost?.toString() || "",
          partsCost: taskData.partsCost?.toString() || "",
          serviceProvider: taskData.serviceProvider || "",
          serviceProviderContact: taskData.serviceProviderContact || "",
          assignedTo: taskData.assignedTo || "",
          notes: taskData.notes || "",
        });
      } catch (err) {
        console.error("Failed to load:", err);
        setError("Failed to load maintenance task.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [taskId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await maintenanceService.update(task.id, {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type as MaintenanceType,
        priority: formData.priority,
        status: formData.status,
        vehicleId: formData.vehicleId,
        scheduledDate: formData.scheduledDate || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
        laborCost: formData.laborCost ? parseFloat(formData.laborCost) : undefined,
        partsCost: formData.partsCost ? parseFloat(formData.partsCost) : undefined,
        serviceProvider: formData.serviceProvider || undefined,
        serviceProviderContact: formData.serviceProviderContact || undefined,
        assignedTo: formData.assignedTo || undefined,
        notes: formData.notes || undefined,
      });
      router.push(`/maintenance/${task.id}`);
    } catch (err) {
      console.error("Failed to update:", err);
      setError(err instanceof Error ? err.message : "Failed to update task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" asChild><Link href="/fleet/maintenance">Back to Maintenance</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/maintenance/${taskId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Maintenance Task</h1>
          <p className="text-muted-foreground">Update task details</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={handleInputChange} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => handleSelectChange("type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => handleSelectChange("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={formData.vehicleId} onValueChange={(v) => handleSelectChange("vehicleId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registrationPlate}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input id="scheduledDate" type="date" value={formData.scheduledDate} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Cost Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <Input id="estimatedCost" type="number" step="0.01" value={formData.estimatedCost} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actualCost">Actual Cost</Label>
                    <Input id="actualCost" type="number" step="0.01" value={formData.actualCost} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborCost">Labor Cost</Label>
                    <Input id="laborCost" type="number" step="0.01" value={formData.laborCost} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partsCost">Parts Cost</Label>
                    <Input id="partsCost" type="number" step="0.01" value={formData.partsCost} onChange={handleInputChange} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Service Provider</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceProvider">Provider Name</Label>
                  <Input id="serviceProvider" value={formData.serviceProvider} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceProviderContact">Contact</Label>
                  <Input id="serviceProviderContact" value={formData.serviceProviderContact} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input id="assignedTo" value={formData.assignedTo} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea id="notes" value={formData.notes} onChange={handleInputChange} rows={4} />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                <Save className="mr-2 h-4 w-4" />{isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/maintenance/${taskId}`}>Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
