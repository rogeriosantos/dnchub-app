"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Receipt, AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ticketsService, vehiclesService, driversService } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Ticket, TicketType, TicketStatus, Vehicle, Driver } from "@/types";

const ticketTypes: { value: TicketType; label: string }[] = [
  { value: "speed", label: "Speed" },
  { value: "parking", label: "Parking" },
  { value: "toll", label: "Toll" },
  { value: "red_light", label: "Red Light" },
  { value: "other", label: "Other" },
];

const ticketStatuses: { value: TicketStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "appealed", label: "Appealed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "overdue", label: "Overdue" },
];

export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    ticketNumber: "",
    type: "" as TicketType | "",
    status: "" as TicketStatus | "",
    vehicleId: "",
    driverId: "",
    violationDate: "",
    violationLocation: "",
    issuingAuthority: "",
    amount: "",
    dueDate: "",
    pointsDeducted: "",
    description: "",
    notes: "",
  });

  // Computed values
  const selectedVehicleData = vehicles.find((v) => v.id === formData.vehicleId);
  const selectedDriverData = drivers.find((d) => d.id === formData.driverId);

  // Load ticket and reference data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [ticketData, vehiclesData, driversData] = await Promise.all([
          ticketsService.getById(ticketId),
          vehiclesService.getAll({ limit: 500 }),
          driversService.getAll({ limit: 500 }),
        ]);

        setVehicles(vehiclesData);
        setDrivers(driversData);

        // Populate form with ticket data
        setFormData({
          ticketNumber: ticketData.ticketNumber || "",
          type: ticketData.type,
          status: ticketData.status,
          vehicleId: ticketData.vehicleId,
          driverId: ticketData.driverId || "",
          violationDate: ticketData.violationDate.slice(0, 16), // Format for datetime-local
          violationLocation: ticketData.violationLocation || "",
          issuingAuthority: ticketData.issuingAuthority || "",
          amount: ticketData.amount.toString(),
          dueDate: ticketData.dueDate || "",
          pointsDeducted: ticketData.pointsDeducted?.toString() || "",
          description: ticketData.description || "",
          notes: ticketData.notes || "",
        });
      } catch (err) {
        console.error("Failed to load ticket:", err);
        setLoadError("Failed to load ticket data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [ticketId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const ticketData: Partial<Ticket> = {
        ticketNumber: formData.ticketNumber || undefined,
        type: formData.type as TicketType,
        status: formData.status as TicketStatus,
        vehicleId: formData.vehicleId,
        driverId: formData.driverId || undefined,
        violationDate: new Date(formData.violationDate).toISOString(),
        violationLocation: formData.violationLocation || undefined,
        issuingAuthority: formData.issuingAuthority || undefined,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate || undefined,
        pointsDeducted: formData.pointsDeducted ? parseInt(formData.pointsDeducted) : undefined,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
      };

      await ticketsService.update(ticketId, ticketData);
      router.push(`/tickets/${ticketId}`);
    } catch (err: unknown) {
      console.error("Failed to update ticket:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update ticket. Please try again.";
      setError(errorMessage);
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
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Load error state
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error Loading Ticket</h2>
        <p className="mt-2 text-muted-foreground">{loadError}</p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tickets/${ticketId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Ticket</h1>
          <p className="text-muted-foreground">Update ticket information</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
                <CardDescription>Basic details about the violation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ticketNumber">Ticket Number</Label>
                    <Input
                      id="ticketNumber"
                      placeholder="e.g., TKT-2024-001"
                      value={formData.ticketNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Ticket Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the violation..."
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle & Driver */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle & Driver</CardTitle>
                <CardDescription>Select the vehicle and optionally the driver involved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">Vehicle *</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => handleSelectChange("vehicleId", value)}
                    >
                      <SelectTrigger id="vehicleId">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.registrationPlate} - {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverId">Driver</Label>
                    <Select
                      value={formData.driverId || "none"}
                      onValueChange={(value) => handleSelectChange("driverId", value === "none" ? "" : value)}
                    >
                      <SelectTrigger id="driverId">
                        <SelectValue placeholder="Select driver (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedVehicleData && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium">Vehicle Details</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Make/Model:</span>{" "}
                        {selectedVehicleData.make} {selectedVehicleData.model}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Year:</span>{" "}
                        {selectedVehicleData.year}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Violation Details */}
            <Card>
              <CardHeader>
                <CardTitle>Violation Details</CardTitle>
                <CardDescription>When and where did the violation occur?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="violationDate">Violation Date *</Label>
                    <Input
                      id="violationDate"
                      type="datetime-local"
                      required
                      value={formData.violationDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="violationLocation">Location</Label>
                    <Input
                      id="violationLocation"
                      placeholder="e.g., Main Street & 5th Avenue"
                      value={formData.violationLocation}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                  <Input
                    id="issuingAuthority"
                    placeholder="e.g., City Police Department"
                    value={formData.issuingAuthority}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Amount and due date information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsDeducted">Points Deducted</Label>
                    <Input
                      id="pointsDeducted"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.pointsDeducted}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>Any other relevant information</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  placeholder="Enter any additional notes..."
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Ticket overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                  <div className="text-center">
                    <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-3xl font-bold tabular-nums">
                      {formatCurrency(formData.amount ? parseFloat(formData.amount) : 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Ticket Amount</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">
                      {formData.type ? ticketTypes.find(t => t.value === formData.type)?.label : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">
                      {formData.status ? ticketStatuses.find(s => s.value === formData.status)?.label : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-medium">
                      {selectedVehicleData?.registrationPlate || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver</span>
                    <span className="font-medium">
                      {selectedDriverData ? `${selectedDriverData.firstName} ${selectedDriverData.lastName}` : "Not selected"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href={`/tickets/${ticketId}`}>Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
