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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, AlertTriangle, Fuel, Gauge } from "lucide-react";
import { fuelPumpsService, fuelPumpDeliveriesService } from "@/lib/api";
import type { FuelPumpDeliveryCreateRequest } from "@/lib/api/types";
import type { FuelPump, FuelType } from "@/types";
import { formatNumber } from "@/lib/utils";

// Fuel type labels
const fuelTypeLabels: Record<FuelType, string> = {
  diesel: "Diesel",
  petrol: "Petrol",
  gasoline: "Gasoline",
  electric: "Electric",
  hybrid: "Hybrid",
  lpg: "LPG",
  cng: "CNG",
};

// Get level color based on percentage
function getLevelColor(percentage: number): string {
  if (percentage <= 20) return "bg-red-500";
  if (percentage <= 40) return "bg-amber-500";
  return "bg-green-500";
}

export default function NewFuelPumpDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const pumpId = params.id as string;

  const [pump, setPump] = React.useState<FuelPump | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return {
      deliveryDate: now.toISOString().split("T")[0],
      deliveryTime: currentTime,
      volume: "",
      pricePerUnit: "",
      supplier: "",
      invoiceNumber: "",
      pumpOdometerBefore: "",
      pumpOdometerAfter: "",
      levelBefore: "",
      levelAfter: "",
      notes: "",
    };
  });

  // Initialize form with pump data when loaded
  React.useEffect(() => {
    if (pump) {
      setFormData((prev) => ({
        ...prev,
        pumpOdometerBefore: pump.currentOdometer.toString(),
        levelBefore: pump.currentLevel.toString(),
        levelAfter: pump.currentLevel.toString(), // Will be updated when volume changes
      }));
    }
  }, [pump]);

  // Calculated values
  const volume = Number(formData.volume) || 0;
  const pricePerUnit = Number(formData.pricePerUnit) || 0;
  const totalCost = volume * pricePerUnit;
  const levelBefore = Number(formData.levelBefore) || 0;
  const levelAfter = Number(formData.levelAfter) || 0;
  const estimatedPercentageAfter = pump && pump.capacity > 0 ? (levelAfter / pump.capacity) * 100 : 0;

  // Auto-update levelAfter when volume changes
  React.useEffect(() => {
    if (pump && volume > 0) {
      const calculatedLevelAfter = Math.min(levelBefore + volume, pump.capacity);
      setFormData((prev) => ({
        ...prev,
        levelAfter: calculatedLevelAfter.toString(),
      }));
    }
  }, [volume, levelBefore, pump]);

  // Load pump data
  React.useEffect(() => {
    async function loadPump() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const pumpData = await fuelPumpsService.getById(pumpId);
        setPump(pumpData);
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
    if (!formData.deliveryDate) {
      setError("Delivery date is required");
      return;
    }
    if (!formData.volume || Number(formData.volume) <= 0) {
      setError("Volume must be greater than 0");
      return;
    }
    if (!formData.pricePerUnit || Number(formData.pricePerUnit) <= 0) {
      setError("Price per unit must be greater than 0");
      return;
    }

    if (!pump) {
      setError("Pump data not available");
      return;
    }
    if (!formData.levelBefore || Number(formData.levelBefore) < 0) {
      setError("Level before is required");
      return;
    }
    if (!formData.levelAfter || Number(formData.levelAfter) < 0) {
      setError("Level after is required");
      return;
    }

    try {
      setIsSubmitting(true);

      const request: FuelPumpDeliveryCreateRequest = {
        pump_id: pumpId,
        delivery_date: formData.deliveryDate,
        delivery_time: formData.deliveryTime || undefined,
        volume: Number(formData.volume),
        price_per_unit: Number(formData.pricePerUnit),
        supplier: formData.supplier.trim() || undefined,
        invoice_number: formData.invoiceNumber.trim() || undefined,
        // Required fields - from form (pre-populated but editable)
        pump_odometer_before: Number(formData.pumpOdometerBefore),
        pump_odometer_after: formData.pumpOdometerAfter
          ? Number(formData.pumpOdometerAfter)
          : undefined,
        level_before: Number(formData.levelBefore),
        level_after: Number(formData.levelAfter),
        notes: formData.notes.trim() || undefined,
      };

      await fuelPumpDeliveriesService.create(request);
      router.push(`/fuel-pumps/${pumpId}`);
    } catch (err) {
      console.error("Failed to create delivery:", err);
      setError("Failed to create delivery. Please try again.");
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

  const levelPercentage = pump.levelPercentage ?? (pump.capacity > 0 ? (pump.currentLevel / pump.capacity) * 100 : 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Record Delivery</h1>
          <p className="text-muted-foreground">
            Add a new fuel delivery for {pump.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Delivery Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-destructive">
                {error}
              </div>
            )}

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
                <CardDescription>
                  Enter the fuel delivery information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Delivery Date *</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Delivery Time</Label>
                    <Input
                      id="deliveryTime"
                      type="time"
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="volume">Volume (Liters) *</Label>
                    <Input
                      id="volume"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 5000"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per Liter *</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="e.g., 1.50"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="e.g., Shell, BP"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      placeholder="e.g., INV-2024-001"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pump Readings & Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Pump Readings & Levels</CardTitle>
                <CardDescription>
                  Pre-populated from current pump state. Adjust if needed for corrections.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pumpOdometerBefore">Pump Odometer Before *</Label>
                    <Input
                      id="pumpOdometerBefore"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pumpOdometerBefore}
                      onChange={(e) => setFormData({ ...formData, pumpOdometerBefore: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Pump meter reading before delivery
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pumpOdometerAfter">Pump Odometer After</Label>
                    <Input
                      id="pumpOdometerAfter"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      value={formData.pumpOdometerAfter}
                      onChange={(e) => setFormData({ ...formData, pumpOdometerAfter: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pump meter reading after delivery (optional)
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="levelBefore">Tank Level Before (L) *</Label>
                    <Input
                      id="levelBefore"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.levelBefore}
                      onChange={(e) => setFormData({ ...formData, levelBefore: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Fuel level before delivery
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="levelAfter">Tank Level After (L) *</Label>
                    <Input
                      id="levelAfter"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.levelAfter}
                      onChange={(e) => setFormData({ ...formData, levelAfter: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-calculated but editable for corrections
                    </p>
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
                  placeholder="Any additional notes about this delivery..."
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
                Record Delivery
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar - Pump Info & Preview */}
        <div className="space-y-6">
          {/* Pump Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                {pump.name}
              </CardTitle>
              <CardDescription>
                {pump.code} | {fuelTypeLabels[pump.fuelType]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Level</span>
                  <span className="font-medium tabular-nums">{formatNumber(pump.currentLevel)} L</span>
                </div>
                <Progress
                  value={levelPercentage}
                  className="h-2"
                  // @ts-expect-error - custom indicator class
                  indicatorClassName={getLevelColor(levelPercentage)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {levelPercentage.toFixed(0)}% of {formatNumber(pump.capacity)} L
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Gauge className="h-4 w-4" />
                  Odometer
                </span>
                <span className="font-medium tabular-nums">{formatNumber(pump.currentOdometer)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Preview */}
          {volume > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium tabular-nums">{formatNumber(volume)} L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price/L</span>
                  <span className="font-medium tabular-nums">${pricePerUnit.toFixed(3)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Cost</span>
                    <span className="font-bold text-lg tabular-nums">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level After</span>
                    <span className="font-medium tabular-nums">{formatNumber(levelAfter)} L</span>
                  </div>
                  <Progress
                    value={estimatedPercentageAfter}
                    className="h-2"
                    // @ts-expect-error - custom indicator class
                    indicatorClassName={getLevelColor(estimatedPercentageAfter)}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {estimatedPercentageAfter.toFixed(0)}% of capacity
                  </p>
                  {levelAfter >= pump.capacity && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Tank will be full
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
