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
import { ArrowLeft, Save, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { driversService } from "@/lib/api/drivers";
import { vehiclesService } from "@/lib/api/vehicles";
import type { DriverStatus, Vehicle } from "@/types";

// Status values (labels come from translations)
const driverStatusValues: DriverStatus[] = ["available", "on_duty", "off_duty", "on_leave"];

// License class values
const licenseClassValues = ["A", "B", "C", "D", "M"];

export default function NewDriverPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    employeeId: "",
    address: "",
    licenseNumber: "",
    licenseClass: "",
    licenseIssueDate: "",
    licenseExpiry: "",
    emergencyContact: "",
    emergencyPhone: "",
    hireDate: "",
    status: "available" as DriverStatus,
    assignedVehicleId: "",
    notes: "",
    pinCode: "",
    isBackoffice: false,
  });

  // Load available vehicles
  React.useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await vehiclesService.getAvailable();
        setVehicles(data);
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
      const driverData = {
        employeeId: formData.employeeId || `EMP-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        licenseNumber: formData.licenseNumber,
        licenseClass: formData.licenseClass,
        licenseExpiry: formData.licenseExpiry,
        licenseIssueDate: formData.licenseIssueDate || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        hireDate: formData.hireDate || new Date().toISOString().split("T")[0],
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        notes: formData.notes || undefined,
        assignedVehicleId: formData.assignedVehicleId || undefined,
        pinCode: formData.pinCode || undefined,
        isBackoffice: formData.isBackoffice,
      };

      await driversService.create(driverData);

      // Redirect to drivers list on success
      router.push("/fleet/employees");
    } catch (err: unknown) {
      console.error("Failed to create driver:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create driver. Please try again.";
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
          <Link href="/fleet/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('drivers.addDriver')}</h1>
          <p className="text-muted-foreground">{t('drivers.form.registerNewDriver')}</p>
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
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.personalInfo')}</CardTitle>
                <CardDescription>{t('drivers.form.personalDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('drivers.firstName')} *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('drivers.lastName')} *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('drivers.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('drivers.phone')} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{t('drivers.dateOfBirth')}</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">{t('drivers.employeeId')}</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('drivers.address')}</Label>
                  <Textarea
                    id="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.licenseInfo')}</CardTitle>
                <CardDescription>{t('drivers.form.licenseDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">{t('drivers.licenseNumber')} *</Label>
                    <Input
                      id="licenseNumber"
                      className="font-mono"
                      required
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseClass">{t('drivers.licenseClass.label')} *</Label>
                    <Select
                      value={formData.licenseClass}
                      onValueChange={(value) => handleSelectChange("licenseClass", value)}
                    >
                      <SelectTrigger id="licenseClass">
                        <SelectValue placeholder={t('drivers.form.selectClass')} />
                      </SelectTrigger>
                      <SelectContent>
                        {licenseClassValues.map((lc) => (
                          <SelectItem key={lc} value={lc}>
                            {t(`drivers.licenseClass.${lc}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseIssueDate">{t('drivers.licenseDetails')}</Label>
                    <Input
                      id="licenseIssueDate"
                      type="date"
                      value={formData.licenseIssueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry">{t('drivers.licenseExpiry')} *</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      required
                      value={formData.licenseExpiry}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.emergencyContact')}</CardTitle>
                <CardDescription>{t('drivers.form.emergencyContactDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">{t('drivers.emergencyContact')}</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">{t('drivers.emergencyPhone')}</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.employmentInfo')}</CardTitle>
                <CardDescription>{t('drivers.form.employmentDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">{t('drivers.hireDate')}</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('common.status')} *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder={t('drivers.form.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        {driverStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`drivers.status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pinCode">{t('drivers.form.pinCode')}</Label>
                    <Input
                      id="pinCode"
                      type="password"
                      maxLength={4}
                      value={formData.pinCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setFormData((prev) => ({ ...prev, pinCode: value }));
                      }}
                      className="font-mono tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('drivers.form.pinCodeDescription')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="isBackoffice"
                        checked={formData.isBackoffice}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, isBackoffice: checked === true }))
                        }
                      />
                      <Label htmlFor="isBackoffice" className="cursor-pointer">
                        {t('drivers.form.isBackoffice')}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('drivers.form.isBackofficeDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.additionalNotes')}</CardTitle>
                <CardDescription>{t('drivers.form.otherInfo')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  placeholder={t('drivers.form.notesPlaceholder')}
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.vehicleAssignment')}</CardTitle>
                <CardDescription>{t('drivers.form.vehicleAssignmentDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="assignedVehicle">{t('drivers.assignedVehicle')}</Label>
                  <Select
                    value={formData.assignedVehicleId}
                    onValueChange={(value) => handleSelectChange("assignedVehicleId", value)}
                  >
                    <SelectTrigger id="assignedVehicle">
                      <SelectValue placeholder={t('drivers.form.selectVehicle')} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t('drivers.form.noVehiclesAvailable')}
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
                  {vehicles.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('drivers.form.allVehiclesAssigned')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photo */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.driverPhoto')}</CardTitle>
                <CardDescription>{t('drivers.form.uploadPhoto')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                  <User className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('drivers.form.dragDropUpload')}
                  </p>
                  <Button variant="outline" className="mt-4" type="button">
                    {t('drivers.form.chooseFile')}
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
                    {isSubmitting ? t('common.saving') : t('drivers.form.saveDriver')}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href="/fleet/employees">{t('common.cancel')}</Link>
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
