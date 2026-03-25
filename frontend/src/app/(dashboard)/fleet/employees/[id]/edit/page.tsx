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
import { ArrowLeft, Save, User, AlertCircle, KeyRound, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { driversService } from "@/lib/api/drivers";
import { vehiclesService } from "@/lib/api/vehicles";
import type { Driver, Vehicle, DriverStatus } from "@/types";

// Status values (labels come from translations)
const driverStatusValues: DriverStatus[] = ["available", "on_duty", "off_duty", "on_leave", "suspended"];

// License class values
const licenseClassValues = ["A", "B", "C", "D", "M"];

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const driverId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [driver, setDriver] = React.useState<Driver | null>(null);
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
    isBackoffice: false,
  });
  const [newPinCode, setNewPinCode] = React.useState("");
  const [isPinSaving, setIsPinSaving] = React.useState(false);
  const [pinSuccess, setPinSuccess] = React.useState(false);

  // Load driver data and available vehicles
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [driverData, vehiclesData] = await Promise.all([
          driversService.getById(driverId),
          vehiclesService.getAvailable(),
        ]);

        setDriver(driverData);

        // Include currently assigned vehicle in the list
        if (driverData.assignedVehicleId) {
          try {
            const assignedVehicle = await vehiclesService.getById(driverData.assignedVehicleId);
            const vehicleExists = vehiclesData.some(v => v.id === assignedVehicle.id);
            if (!vehicleExists) {
              setVehicles([assignedVehicle, ...vehiclesData]);
            } else {
              setVehicles(vehiclesData);
            }
          } catch {
            setVehicles(vehiclesData);
          }
        } else {
          setVehicles(vehiclesData);
        }

        // Populate form with driver data
        setFormData({
          firstName: driverData.firstName || "",
          lastName: driverData.lastName || "",
          email: driverData.email || "",
          phone: driverData.phone || "",
          dateOfBirth: driverData.dateOfBirth || "",
          employeeId: driverData.employeeId || "",
          address: driverData.address || "",
          licenseNumber: driverData.licenseNumber || "",
          licenseClass: driverData.licenseClass || "",
          licenseIssueDate: driverData.licenseIssueDate || "",
          licenseExpiry: driverData.licenseExpiry || "",
          emergencyContact: driverData.emergencyContact || "",
          emergencyPhone: driverData.emergencyPhone || "",
          hireDate: driverData.hireDate || "",
          status: driverData.status || "available",
          assignedVehicleId: driverData.assignedVehicleId || "",
          notes: driverData.notes || "",
          isBackoffice: driverData.isBackoffice || false,
        });
      } catch (err) {
        console.error("Failed to load driver:", err);
        setError("Driver not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [driverId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetPin = async () => {
    if (newPinCode.length !== 4) return;

    setIsPinSaving(true);
    setPinSuccess(false);
    try {
      await driversService.setPin(driverId, newPinCode);
      setPinSuccess(true);
      setNewPinCode("");
      setTimeout(() => setPinSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to set PIN:", err);
      setError("Failed to set PIN code");
    } finally {
      setIsPinSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData = {
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
        employeeId: formData.employeeId || undefined,
        hireDate: formData.hireDate || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        notes: formData.notes || undefined,
        assignedVehicleId: formData.assignedVehicleId || undefined,
        isBackoffice: formData.isBackoffice,
      };

      await driversService.update(driverId, updateData);
      router.push(`/fleet/employees/${driverId}`);
    } catch (err) {
      console.error("Failed to update driver:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update driver. Please try again.";
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

  if (error && !driver) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">{t('drivers.driverNotFound')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('drivers.driverNotFoundDescription')}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('drivers.backToDrivers')}
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
          <Link href={`/fleet/employees/${driverId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('drivers.editDriver')}</h1>
          <p className="text-muted-foreground">
            {t('drivers.form.updateDriverDetails', { name: `${driver?.firstName} ${driver?.lastName}` })}
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
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.personalInfo')}</CardTitle>
                <CardDescription>{t('drivers.form.updatePersonalDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('drivers.firstName')} *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('drivers.lastName')} *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('drivers.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('drivers.phone')} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
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
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
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
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseClass">{t('drivers.licenseClass')} *</Label>
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
                      value={formData.licenseExpiry}
                      onChange={handleInputChange}
                      required
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

                <div className="flex items-center space-x-2 pt-2">
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
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={t('drivers.form.notesPlaceholder')}
                  rows={4}
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
                <CardDescription>{t('drivers.form.vehicleAssignmentChangeDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="assignedVehicleId">{t('drivers.assignedVehicle')}</Label>
                  <Select
                    value={formData.assignedVehicleId || "none"}
                    onValueChange={(value) => handleSelectChange("assignedVehicleId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger id="assignedVehicleId">
                      <SelectValue placeholder={t('drivers.form.selectVehicle')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('drivers.form.noVehicle')}</SelectItem>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.registrationPlate} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {vehicles.length === 0 && !formData.assignedVehicleId && (
                    <p className="text-xs text-muted-foreground">
                      {t('drivers.form.allVehiclesAssignedOther')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* POS PIN Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  {t('drivers.form.pinCode')}
                </CardTitle>
                <CardDescription>{t('drivers.form.pinCodeSetDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPinCode">{t('drivers.form.newPinCode')}</Label>
                  <Input
                    id="newPinCode"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={newPinCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setNewPinCode(value);
                    }}
                    className="font-mono tracking-widest text-center"
                  />
                </div>
                {pinSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {t('drivers.form.pinUpdated')}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSetPin}
                  disabled={newPinCode.length !== 4 || isPinSaving}
                >
                  {isPinSaving ? t('common.saving') : t('drivers.form.setPin')}
                </Button>
              </CardContent>
            </Card>

            {/* Photo */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.driverPhoto')}</CardTitle>
                <CardDescription>{t('drivers.form.updatePhoto')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold">
                    {formData.firstName[0] || "?"}
                    {formData.lastName[0] || "?"}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t('drivers.form.clickToChangePhoto')}
                  </p>
                  <Button variant="outline" className="mt-2" type="button">
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
                    {isSubmitting ? t('common.saving') : t('drivers.form.saveChanges')}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href={`/fleet/employees/${driverId}`}>{t('common.cancel')}</Link>
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
