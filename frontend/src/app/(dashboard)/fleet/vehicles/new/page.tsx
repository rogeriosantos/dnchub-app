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
import { ArrowLeft, Save, Truck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { vehiclesService } from "@/lib/api/vehicles";
import { driversService } from "@/lib/api/drivers";
import type { VehicleStatus, VehicleType, FuelType, Driver } from "@/types";

// Status, type, and fuel type values (labels come from translations)
const vehicleStatusValues: VehicleStatus[] = ["active", "idle", "maintenance", "out_of_service"];
const vehicleTypeValues: VehicleType[] = ["sedan", "suv", "truck", "van", "pickup", "bus", "motorcycle", "heavy_truck", "trailer"];
const fuelTypeValues: FuelType[] = ["gasoline", "diesel", "electric", "hybrid", "lpg", "cng"];

export default function NewVehiclePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    registrationPlate: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    type: "" as VehicleType | "",
    color: "",
    status: "active" as VehicleStatus,
    currentOdometer: "",
    fuelType: "" as FuelType | "",
    fuelCapacity: "",
    registrationExpiry: "",
    insuranceExpiry: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    nextServiceDate: "",
    nextServiceOdometer: "",
    assignedDriverId: "",
    notes: "",
  });

  // Load available drivers
  React.useEffect(() => {
    const loadDrivers = async () => {
      try {
        const data = await driversService.getAvailable();
        setDrivers(data);
      } catch (error) {
        console.error("Failed to load drivers:", error);
      }
    };
    loadDrivers();
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
      const vehicleData = {
        registrationPlate: formData.registrationPlate,
        vin: formData.vin || undefined,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year, 10),
        type: formData.type as VehicleType,
        fuelType: formData.fuelType as FuelType,
        status: formData.status,
        color: formData.color || undefined,
        currentOdometer: parseFloat(formData.currentOdometer) || 0,
        fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : undefined,
        registrationExpiry: formData.registrationExpiry || undefined,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        insuranceProvider: formData.insuranceProvider || undefined,
        insurancePolicyNumber: formData.insurancePolicyNumber || undefined,
        nextServiceDate: formData.nextServiceDate || undefined,
        nextServiceOdometer: formData.nextServiceOdometer ? parseFloat(formData.nextServiceOdometer) : undefined,
        assignedDriverId: formData.assignedDriverId || undefined,
        notes: formData.notes || undefined,
      };

      await vehiclesService.create(vehicleData);

      // Redirect to vehicles list on success
      router.push("/fleet/vehicles");
    } catch (err: unknown) {
      console.error("Failed to create vehicle:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create vehicle. Please try again.";
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
          <Link href="/fleet/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('vehicles.addVehicle')}</h1>
          <p className="text-muted-foreground">{t('vehicles.form.registerNewVehicle')}</p>
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
                <CardDescription>{t('vehicles.form.enterBasicDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registrationPlate">{t('vehicles.registrationPlate')} *</Label>
                    <Input
                      id="registrationPlate"
                      placeholder="ABC-1234"
                      required
                      value={formData.registrationPlate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vin">{t('vehicles.vin')}</Label>
                    <Input
                      id="vin"
                      placeholder="1HGBH41JXMN109186"
                      className="font-mono"
                      value={formData.vin}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="make">{t('vehicles.make')} *</Label>
                    <Input
                      id="make"
                      placeholder="Toyota"
                      required
                      value={formData.make}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">{t('vehicles.model')} *</Label>
                    <Input
                      id="model"
                      placeholder="Camry"
                      required
                      value={formData.model}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">{t('vehicles.year')} *</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2024"
                      min="1900"
                      max="2100"
                      required
                      value={formData.year}
                      onChange={handleInputChange}
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
                      placeholder="White"
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
                      placeholder="0"
                      min="0"
                      required
                      value={formData.currentOdometer}
                      onChange={handleInputChange}
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
                    <Label htmlFor="fuelCapacity">{t('vehicles.fuelCapacity')}</Label>
                    <Input
                      id="fuelCapacity"
                      type="number"
                      placeholder="60"
                      min="1"
                      value={formData.fuelCapacity}
                      onChange={handleInputChange}
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
                      placeholder="Insurance Company"
                      value={formData.insuranceProvider}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurancePolicyNumber">{t('vehicles.policyNumber')}</Label>
                    <Input
                      id="insurancePolicyNumber"
                      placeholder="POL-123456"
                      className="font-mono"
                      value={formData.insurancePolicyNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.serviceSchedule')}</CardTitle>
                <CardDescription>{t('vehicles.form.maintenanceReminders')}</CardDescription>
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
                      placeholder="10000"
                      min="0"
                      value={formData.nextServiceOdometer}
                      onChange={handleInputChange}
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
                  placeholder={t('vehicles.form.notesPlaceholder')}
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
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
                    value={formData.assignedDriverId}
                    onValueChange={(value) => handleSelectChange("assignedDriverId", value)}
                  >
                    <SelectTrigger id="assignedDriverId">
                      <SelectValue placeholder={t('vehicles.form.selectDriver')} />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t('vehicles.form.noDriversAvailable')}
                        </SelectItem>
                      ) : (
                        drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {drivers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('vehicles.form.allDriversAssigned')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.form.vehiclePhoto')}</CardTitle>
                <CardDescription>{t('vehicles.form.uploadPhoto')}</CardDescription>
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
                    {isSubmitting ? t('common.saving') : t('vehicles.form.createVehicle')}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href="/fleet/vehicles">{t('common.cancel')}</Link>
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
