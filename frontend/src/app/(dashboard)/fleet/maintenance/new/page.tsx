"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Wrench, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { maintenanceService } from "@/lib/api/maintenance";
import { vehiclesService } from "@/lib/api/vehicles";
import type { MaintenanceType, MaintenancePriority, Vehicle } from "@/types";

export default function NewMaintenancePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    type: "" as MaintenanceType | "",
    priority: "medium" as MaintenancePriority,
    vehicleId: "",
    scheduledDate: "",
    estimatedCost: "",
    serviceProvider: "",
    serviceProviderContact: "",
    notes: "",
    category: "General",
  });

  const maintenanceTypes: { value: MaintenanceType; label: string; description: string }[] = [
    { value: "preventive", label: t("maintenance.type.preventive"), description: t("maintenance.type.preventiveDesc") },
    { value: "corrective", label: t("maintenance.type.corrective"), description: t("maintenance.type.correctiveDesc") },
    { value: "inspection", label: t("maintenance.type.inspection"), description: t("maintenance.type.inspectionDesc") },
    { value: "recall", label: t("maintenance.type.recall"), description: t("maintenance.type.recallDesc") },
    { value: "emergency", label: t("maintenance.type.emergency"), description: t("maintenance.type.emergencyDesc") },
  ];

  const priorities: { value: MaintenancePriority; label: string }[] = [
    { value: "low", label: t("maintenance.priority.low") },
    { value: "medium", label: t("maintenance.priority.medium") },
    { value: "high", label: t("maintenance.priority.high") },
  ];

  // Computed values
  const selectedVehicleData = vehicles.find((v) => v.id === formData.vehicleId);

  // Load available vehicles
  React.useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await vehiclesService.getAll();
        // Filter out out_of_service vehicles
        setVehicles(data.filter((v) => v.status !== "out_of_service"));
      } catch (error) {
        console.error("Failed to load vehicles:", error);
      }
    };
    loadVehicles();
  }, []);

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
      // Prepare data for API
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type as MaintenanceType,
        priority: formData.priority,
        vehicleId: formData.vehicleId,
        scheduledDate: formData.scheduledDate || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        serviceProvider: formData.serviceProvider || undefined,
        serviceProviderContact: formData.serviceProviderContact || undefined,
        notes: formData.notes || undefined,
        category: formData.category,
        status: "scheduled" as const,
      };

      await maintenanceService.create(taskData);

      // Redirect to maintenance list on success
      router.push("/fleet/maintenance");
    } catch (err: unknown) {
      console.error("Failed to create maintenance task:", err);
      const errorMessage = err instanceof Error ? err.message : t("maintenance.errors.createFailed");
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fleet/maintenance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("maintenance.new.title")}</h1>
          <p className="text-muted-foreground">{t("maintenance.new.description")}</p>
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("maintenance.new.taskInfo")}</CardTitle>
                <CardDescription>{t("maintenance.new.taskInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("maintenance.fields.taskTitle")}</Label>
                  <Input
                    id="title"
                    placeholder={t("maintenance.fields.taskTitlePlaceholder")}
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("maintenance.fields.description")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("maintenance.fields.descriptionPlaceholder")}
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t("maintenance.fields.type")}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t("maintenance.fields.selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div>{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">{t("maintenance.fields.priority")}</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleSelectChange("priority", value)}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder={t("maintenance.fields.selectPriority")} />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t("maintenance.new.vehicle")}</CardTitle>
                <CardDescription>{t("maintenance.new.vehicleDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleId">{t("maintenance.fields.vehicle")}</Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(value) => handleSelectChange("vehicleId", value)}
                  >
                    <SelectTrigger id="vehicleId">
                      <SelectValue placeholder={t("maintenance.fields.selectVehicle")} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t("common.noVehiclesAvailable")}
                        </SelectItem>
                      ) : (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.registrationPlate} - {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVehicleData && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium">{t("maintenance.new.vehicleDetails")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("vehicles.fields.makeModel")}:</span>{" "}
                        {selectedVehicleData.make} {selectedVehicleData.model}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("vehicles.fields.year")}:</span>{" "}
                        {selectedVehicleData.year}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("vehicles.fields.odometer")}:</span>{" "}
                        {selectedVehicleData.currentOdometer.toLocaleString()} km
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("common.status")}:</span>{" "}
                        <span className="capitalize">
                          {selectedVehicleData.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>{t("maintenance.new.schedule")}</CardTitle>
                <CardDescription>{t("maintenance.new.scheduleDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">{t("maintenance.fields.scheduledDate")}</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      required
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">{t("maintenance.fields.estimatedCost")}</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.estimatedCost}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Provider */}
            <Card>
              <CardHeader>
                <CardTitle>{t("maintenance.new.serviceProvider")}</CardTitle>
                <CardDescription>{t("maintenance.new.serviceProviderDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="serviceProvider">{t("maintenance.fields.serviceProvider")}</Label>
                    <Input
                      id="serviceProvider"
                      placeholder={t("maintenance.fields.serviceProviderPlaceholder")}
                      value={formData.serviceProvider}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceProviderContact">{t("maintenance.fields.serviceProviderContact")}</Label>
                    <Input
                      id="serviceProviderContact"
                      placeholder={t("maintenance.fields.serviceProviderContactPlaceholder")}
                      value={formData.serviceProviderContact}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t("common.additionalNotes")}</CardTitle>
                <CardDescription>{t("common.additionalNotesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  placeholder={t("maintenance.fields.notesPlaceholder")}
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
                <CardTitle>{t("common.summary")}</CardTitle>
                <CardDescription>{t("maintenance.new.taskOverview")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                  <div className="text-center">
                    <Wrench className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-3xl font-bold tabular-nums">
                      ${formData.estimatedCost ? parseFloat(formData.estimatedCost).toFixed(2) : "0.00"}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("maintenance.fields.estimatedCost")}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("maintenance.fields.vehicle")}</span>
                    <span className="font-medium">
                      {selectedVehicleData?.registrationPlate || t("common.notSelected")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("maintenance.fields.type")}</span>
                    <span className="font-medium capitalize">
                      {formData.type || t("common.notSelected")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("maintenance.fields.priority")}</span>
                    <span className="font-medium capitalize">
                      {formData.priority}
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
                    {isSubmitting ? t("common.saving") : t("maintenance.new.scheduleTask")}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href="/fleet/maintenance">{t("common.cancel")}</Link>
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
