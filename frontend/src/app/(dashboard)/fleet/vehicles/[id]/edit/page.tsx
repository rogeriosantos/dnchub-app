"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Truck, AlertCircle } from "lucide-react";
import { vehiclesService } from "@/lib/api/vehicles";
import { driversService } from "@/lib/api/drivers";
import type { Vehicle, Driver, VehicleStatus, VehicleType, FuelType } from "@/types";

// Status, type, and fuel type values (labels come from translations)
const vehicleStatusValues: VehicleStatus[] = ["active", "in_transit", "idle", "maintenance", "out_of_service"];
const vehicleTypeValues: VehicleType[] = ["sedan", "suv", "truck", "van", "pickup", "bus", "motorcycle", "heavy_truck", "trailer"];
const fuelTypeValues: FuelType[] = ["gasoline", "diesel", "electric", "hybrid", "lpg", "cng"];

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const vehicleId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    registrationPlate: "",
    vin: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    type: "sedan" as VehicleType,
    color: "",
    status: "active" as VehicleStatus,
    currentOdometer: 0,
    fuelType: "gasoline" as FuelType,
    fuelCapacity: 0,
    registrationExpiry: "",
    insuranceExpiry: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    nextServiceDate: "",
    nextServiceOdometer: "",
    assignedDriverId: "",
    notes: "",
  });

  // Load vehicle data and available drivers
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [vehicleData, availableDrivers] = await Promise.all([
          vehiclesService.getById(vehicleId),
          driversService.getAvailable(),
        ]);

        setVehicle(vehicleData);

        // Build the drivers list:
        // 1. Start with available drivers (those without assigned vehicle)
        // 2. Include the driver assigned via vehicle.assignedDriverId (if any)
        // 3. Include any driver who has this vehicle as their assigned_vehicle_id (handles inconsistent data)
        let driversToShow = [...availableDrivers];

        // Check if vehicle has an assigned driver via assignedDriverId
        if (vehicleData.assignedDriverId) {
          try {
            const assignedDriver = await driversService.getById(vehicleData.assignedDriverId);
            const driverExists = driversToShow.some(d => d.id === assignedDriver.id);
            if (!driverExists) {
              driversToShow = [assignedDriver, ...driversToShow];
            }
          } catch {
            // Driver not found, continue
          }
        }

        // Also check for any driver who has THIS vehicle assigned to them (handles inconsistent data)
        const driverByVehicle = await driversService.getByVehicle(vehicleId);
        if (driverByVehicle) {
          const driverExists = driversToShow.some(d => d.id === driverByVehicle.id);
          if (!driverExists) {
            driversToShow = [driverByVehicle, ...driversToShow];
          }
          // Also set this driver as the form value if vehicle.assignedDriverId is empty
          if (!vehicleData.assignedDriverId) {
            setFormData(prev => ({ ...prev, assignedDriverId: driverByVehicle.id }));
          }
        }

        setDrivers(driversToShow);

        // Populate form with vehicle data
        setFormData({
          registrationPlate: vehicleData.registrationPlate || "",
          vin: vehicleData.vin || "",
          make: vehicleData.make || "",
          model: vehicleData.model || "",
          year: vehicleData.year || new Date().getFullYear(),
          type: vehicleData.type || "sedan",
          color: vehicleData.color || "",
          status: vehicleData.status || "active",
          currentOdometer: vehicleData.currentOdometer || 0,
          fuelType: vehicleData.fuelType || "gasoline",
          fuelCapacity: vehicleData.fuelCapacity || 0,
          registrationExpiry: vehicleData.registrationExpiry || "",
          insuranceExpiry: vehicleData.insuranceExpiry || "",
          insuranceProvider: vehicleData.insuranceProvider || "",
          insurancePolicyNumber: vehicleData.insurancePolicyNumber || "",
          nextServiceDate: vehicleData.nextServiceDate || "",
          nextServiceOdometer: vehicleData.nextServiceOdometer?.toString() || "",
          assignedDriverId: vehicleData.assignedDriverId || "",
          notes: vehicleData.notes || "",
        });
      } catch (err) {
        console.error("Failed to load vehicle:", err);
        setError("Vehicle not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vehicleId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData = {
        registrationPlate: formData.registrationPlate,
        vin: formData.vin || undefined,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        type: formData.type,
        color: formData.color || undefined,
        status: formData.status,
        currentOdometer: formData.currentOdometer,
        fuelType: formData.fuelType,
        fuelCapacity: formData.fuelCapacity,
        registrationExpiry: formData.registrationExpiry || undefined,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        insuranceProvider: formData.insuranceProvider || undefined,
        insurancePolicyNumber: formData.insurancePolicyNumber || undefined,
        nextServiceDate: formData.nextServiceDate || undefined,
        nextServiceOdometer: formData.nextServiceOdometer ? Number(formData.nextServiceOdometer) : undefined,
        assignedDriverId: formData.assignedDriverId || undefined,
        notes: formData.notes || undefined,
      };

      await vehiclesService.update(vehicleId, updateData);
      router.push(`/fleet/vehicles/${vehicleId}`);
    } catch (err) {
      console.error("Failed to update vehicle:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update vehicle. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Truck className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">{t('vehicles.notFound')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('vehicles.notFoundDescription')}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/vehicles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.backTo', { page: t('vehicles.title') })}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/fleet/vehicles/${vehicleId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('vehicles.editVehicle')}</h1>
          <p className="text-muted-foreground">
            {t('vehicles.form.updateDetails', { plate: vehicle?.registrationPlate })}
          </p>
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
                <CardTitle>{t('vehicles.form.basicInfo')}</CardTitle>
                <CardDescription>{t('vehicles.form.updateBasicDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registrationPlate">{t('vehicles.registrationPlate')} *</Label>
                    <Input
                      id="registrationPlate"
                      value={formData.registrationPlate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vin">{t('vehicles.vin')}</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={handleInputChange}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="make">{t('vehicles.make')} *</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">{t('vehicles.model')} *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">{t('vehicles.year')} *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={handleInputChange}
                      min="1900"
                      max="2100"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('common.type')} *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('vehicles.form.selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypeValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`vehicles.types.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">{t('vehicles.color')}</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('common.status')} *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder={t('vehicles.form.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`vehicles.status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentOdometer">{t('vehicles.currentOdometer')} (km) *</Label>
                    <Input
                      id="currentOdometer"
                      type="number"
                      value={formData.currentOdometer}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fuel Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.fuelInfo')}</CardTitle>
                <CardDescription>{t('vehicles.form.fuelTypeCapacity')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">{t('vehicles.fuelType')} *</Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value) => handleSelectChange("fuelType", value)}
                    >
                      <SelectTrigger id="fuelType">
                        <SelectValue placeholder={t('vehicles.form.selectFuelType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypeValues.map((fuel) => (
                          <SelectItem key={fuel} value={fuel}>
                            {t(`fuel.types.${fuel}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelCapacity">{t('vehicles.fuelCapacity')} *</Label>
                    <Input
                      id="fuelCapacity"
                      type="number"
                      value={formData.fuelCapacity}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration & Insurance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.registrationInsurance')}</CardTitle>
                <CardDescription>{t('vehicles.legalInsurance')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registrationExpiry">{t('vehicles.registrationExpiry')}</Label>
                    <Input
                      id="registrationExpiry"
                      type="date"
                      value={formData.registrationExpiry}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceExpiry">{t('vehicles.insuranceExpiry')}</Label>
                    <Input
                      id="insuranceExpiry"
                      type="date"
                      value={formData.insuranceExpiry}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceProvider">{t('vehicles.insuranceProvider')}</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurancePolicyNumber">{t('vehicles.policyNumber')}</Label>
                    <Input
                      id="insurancePolicyNumber"
                      value={formData.insurancePolicyNumber}
                      onChange={handleInputChange}
                      className="font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.serviceSchedule')}</CardTitle>
                <CardDescription>{t('vehicles.form.updateReminders')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nextServiceDate">{t('vehicles.nextServiceDate')}</Label>
                    <Input
                      id="nextServiceDate"
                      type="date"
                      value={formData.nextServiceDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextServiceOdometer">{t('vehicles.nextServiceOdometer')} (km)</Label>
                    <Input
                      id="nextServiceOdometer"
                      type="number"
                      value={formData.nextServiceOdometer}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.additionalNotes')}</CardTitle>
                <CardDescription>{t('vehicles.form.otherInfo')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={t('vehicles.form.notesPlaceholder')}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.assignment')}</CardTitle>
                <CardDescription>{t('vehicles.form.assignDriverDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedDriverId">{t('vehicles.assignedDriver')}</Label>
                  <Select
                    value={formData.assignedDriverId || "unassigned"}
                    onValueChange={(value) => handleSelectChange("assignedDriverId", value === "unassigned" ? "" : value)}
                  >
                    <SelectTrigger id="assignedDriverId">
                      <SelectValue placeholder={t('vehicles.form.selectDriver')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t('common.unassigned')}</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {drivers.length === 0 && !formData.assignedDriverId && (
                    <p className="text-xs text-muted-foreground">
                      {t('vehicles.form.allDriversAssignedOther')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Image */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.vehiclePhoto')}</CardTitle>
                <CardDescription>{t('vehicles.form.updatePhoto')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                  <Truck className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('vehicles.form.dragDropUpload')}
                  </p>
                  <Button variant="outline" className="mt-4" type="button">
                    {t('vehicles.form.chooseFile')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? t('common.saving') : t('common.save')}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href={`/fleet/vehicles/${vehicleId}`}>{t('common.cancel')}</Link>
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
