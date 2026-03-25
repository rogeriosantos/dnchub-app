"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { fuelPumpsService } from "@/lib/api";
import type { FuelPumpUpdateRequest } from "@/lib/api/types";
import type { FuelPump, FuelType, PumpStatus } from "@/types";

const fuelTypes: { value: FuelType; label: string }[] = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "gasoline", label: "Gasoline" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "lpg", label: "LPG" },
  { value: "cng", label: "CNG" },
];

const pumpStatuses: { value: PumpStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of Service" },
];

export default function EditFuelPumpPage() {
  const params = useParams();
  const router = useRouter();
  const pumpId = params.id as string;

  const [pump, setPump] = React.useState<FuelPump | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    fuelType: "diesel" as FuelType,
    status: "active" as PumpStatus,
    capacity: "",
    currentLevel: "",
    minimumLevel: "",
    currentOdometer: "",
    location: "",
    maintenanceIntervalDays: "",
    lastMaintenanceDate: "",
    nextMaintenanceDate: "",
    isDefault: false,
    notes: "",
  });

  // Load pump data
  React.useEffect(() => {
    async function loadPump() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const pumpData = await fuelPumpsService.getById(pumpId);
        setPump(pumpData);
        setFormData({
          name: pumpData.name,
          code: pumpData.code,
          fuelType: pumpData.fuelType,
          status: pumpData.status,
          capacity: String(pumpData.capacity),
          currentLevel: String(pumpData.currentLevel),
          minimumLevel: String(pumpData.minimumLevel),
          currentOdometer: String(pumpData.currentOdometer),
          location: pumpData.location || "",
          maintenanceIntervalDays: pumpData.maintenanceIntervalDays ? String(pumpData.maintenanceIntervalDays) : "",
          lastMaintenanceDate: pumpData.lastMaintenanceDate || "",
          nextMaintenanceDate: pumpData.nextMaintenanceDate || "",
          isDefault: pumpData.isDefault,
          notes: pumpData.notes || "",
        });
      } catch (err) {
        console.error("Failed to load pump:", err);
        setLoadError("Failed to load pump data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPump();
  }, [pumpId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Pump name is required");
      return;
    }
    if (!formData.code.trim()) {
      setError("Pump code is required");
      return;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setError("Capacity must be greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);

      const request: FuelPumpUpdateRequest = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        fuel_type: formData.fuelType,
        status: formData.status,
        capacity: Number(formData.capacity),
        current_level: Number(formData.currentLevel) || 0,
        minimum_level: Number(formData.minimumLevel) || 0,
        current_odometer: Number(formData.currentOdometer) || 0,
        location: formData.location.trim() || undefined,
        maintenance_interval_days: formData.maintenanceIntervalDays
          ? Number(formData.maintenanceIntervalDays)
          : undefined,
        last_maintenance_date: formData.lastMaintenanceDate || undefined,
        next_maintenance_date: formData.nextMaintenanceDate || undefined,
        is_default: formData.isDefault,
        notes: formData.notes.trim() || undefined,
      };

      await fuelPumpsService.update(pumpId, request);
      router.push(`/fuel-pumps/${pumpId}`);
    } catch (err) {
      console.error("Failed to update pump:", err);
      setError("Failed to update pump. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
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
  if (loadError || !pump) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error Loading Pump</h2>
        <p className="mt-2 text-muted-foreground">{loadError || "Pump not found"}</p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/fuel-pumps">Back to Pumps</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/fuel-pumps/${pumpId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to pump</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Pump</h1>
          <p className="text-muted-foreground">
            Update {pump.name} details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details of the fuel pump
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Pump Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Diesel Tank A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Pump Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., PUMP-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type *</Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(value) => setFormData({ ...formData, fuelType: value as FuelType })}
                >
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PumpStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {pumpStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Warehouse A, Bay 3"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked === true })
                }
              />
              <Label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Default pump for POS
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                (Auto-select this pump in POS when fuel type matches)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity & Levels</CardTitle>
            <CardDescription>
              Update the capacity and current fuel level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Liters) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 10000"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentLevel">Current Level (Liters)</Label>
                <Input
                  id="currentLevel"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 5000"
                  value={formData.currentLevel}
                  onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumLevel">Minimum Level (Liters)</Label>
                <Input
                  id="minimumLevel"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1000 (alert threshold)"
                  value={formData.minimumLevel}
                  onChange={(e) => setFormData({ ...formData, minimumLevel: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentOdometer">Current Pump Odometer</Label>
              <Input
                id="currentOdometer"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 12500"
                value={formData.currentOdometer}
                onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>
              Update maintenance schedule for this pump
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maintenanceIntervalDays">Maintenance Interval (Days)</Label>
                <Input
                  id="maintenanceIntervalDays"
                  type="number"
                  min="0"
                  placeholder="e.g., 90"
                  value={formData.maintenanceIntervalDays}
                  onChange={(e) => setFormData({ ...formData, maintenanceIntervalDays: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastMaintenanceDate">Last Maintenance</Label>
                <Input
                  id="lastMaintenanceDate"
                  type="date"
                  value={formData.lastMaintenanceDate}
                  onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextMaintenanceDate">Next Maintenance</Label>
                <Input
                  id="nextMaintenanceDate"
                  type="date"
                  value={formData.nextMaintenanceDate}
                  onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this pump..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/fuel-pumps/${pumpId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
