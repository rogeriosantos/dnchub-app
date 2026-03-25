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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Fuel, AlertCircle } from "lucide-react";
import { fuelService, vehiclesService, driversService } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { FuelType, Vehicle, Driver } from "@/types";

const fuelTypeValues: FuelType[] = ["gasoline", "diesel", "electric", "hybrid", "lpg", "cng"];

export default function LogFuelPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("");
  const [selectedDriver, setSelectedDriver] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
  const [time, setTime] = React.useState<string>(new Date().toTimeString().slice(0, 5));
  const [fuelType, setFuelType] = React.useState<string>("");
  const [station, setStation] = React.useState<string>("");
  const [volume, setVolume] = React.useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = React.useState<number>(0);
  const [odometer, setOdometer] = React.useState<number>(0);
  const [isFullTank, setIsFullTank] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<string>("");
  const [receiptNumber, setReceiptNumber] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  // Calculate total cost
  const totalCost = volume * pricePerUnit;

  // Load data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [vehiclesData, driversData] = await Promise.all([
          vehiclesService.getAll({ limit: 500 }),
          driversService.getAll({ limit: 500 }),
        ]);

        // Filter active vehicles
        const activeVehicles = vehiclesData.filter((v) => v.status !== "out_of_service");
        // Filter active drivers
        const activeDrivers = driversData.filter((d) => d.status !== "suspended");

        setVehicles(activeVehicles);
        setDrivers(activeDrivers);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(t('fuel.errors.failedToLoadVehiclesDrivers'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Get selected vehicle data
  const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);

  // Update odometer, fuel type, and driver when vehicle changes
  React.useEffect(() => {
    if (selectedVehicleData) {
      setOdometer(selectedVehicleData.currentOdometer);
      if (!fuelType) {
        setFuelType(selectedVehicleData.fuelType);
      }
      // Pre-fill with assigned driver (user can still change it)
      if (selectedVehicleData.assignedDriverId) {
        setSelectedDriver(selectedVehicleData.assignedDriverId);
      }
    }
  }, [selectedVehicle]); // Only trigger when vehicle selection changes

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedVehicle) {
      setSubmitError(t('fuel.form.validation.selectVehicle'));
      return;
    }

    if (!fuelType) {
      setSubmitError(t('fuel.form.validation.selectFuelType'));
      return;
    }

    if (volume <= 0) {
      setSubmitError(t('fuel.form.validation.volumeGreaterThanZero'));
      return;
    }

    if (pricePerUnit <= 0) {
      setSubmitError(t('fuel.form.validation.priceGreaterThanZero'));
      return;
    }

    if (odometer <= 0) {
      setSubmitError(t('fuel.form.validation.odometerGreaterThanZero'));
      return;
    }

    try {
      setIsSubmitting(true);

      await fuelService.create({
        vehicleId: selectedVehicle,
        driverId: selectedDriver || undefined,
        date,
        time: time || undefined,
        fuelType: fuelType as FuelType,
        station: station || undefined,
        volume,
        pricePerUnit,
        odometer,
        fullTank: isFullTank,
        paymentMethod: paymentMethod || undefined,
        receiptNumber: receiptNumber || undefined,
        notes: notes || undefined,
      });

      router.push("/fleet/fuel");
    } catch (err) {
      console.error("Failed to create fuel entry:", err);
      setSubmitError(t('fuel.errors.failedToSaveEntry'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-32 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">{t('fuel.errors.errorLoadingData')}</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fleet/fuel">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('fuel.form.logTitle')}</h1>
          <p className="text-muted-foreground">{t('fuel.form.logSubtitle')}</p>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle and Driver */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.form.vehicleAndDriver')}</CardTitle>
                <CardDescription>{t('fuel.form.vehicleAndDriverDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">{t('fuel.vehicle')} *</Label>
                    <Select
                      value={selectedVehicle}
                      onValueChange={setSelectedVehicle}
                      required
                    >
                      <SelectTrigger id="vehicle">
                        <SelectValue placeholder={t('fuel.form.selectVehicle')} />
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
                    <Label htmlFor="driver">{t('fuel.driver')}</Label>
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger id="driver">
                        <SelectValue placeholder={t('fuel.form.selectDriver')} />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fuel Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.form.fuelDetails')}</CardTitle>
                <CardDescription>{t('fuel.form.enterFuelDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('fuel.date')} *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">{t('fuel.time')}</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">{t('fuel.filter.fuelType')} *</Label>
                    <Select value={fuelType} onValueChange={setFuelType} required>
                      <SelectTrigger id="fuelType">
                        <SelectValue placeholder={t('fuel.form.selectFuelType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypeValues.map((fuelValue) => (
                          <SelectItem key={fuelValue} value={fuelValue}>
                            {t(`fuel.fuelTypes.${fuelValue}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station">{t('fuel.fuelStation')}</Label>
                    <Input
                      id="station"
                      placeholder={t('fuel.stationPlaceholder')}
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="volume">{t('fuel.volumeLiters')} *</Label>
                    <Input
                      id="volume"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={volume || ""}
                      onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">{t('fuel.pricePerLiterFull')} *</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={pricePerUnit || ""}
                      onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCost">{t('fuel.totalCost')}</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                      <span className="font-medium tabular-nums">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fullTank"
                    checked={isFullTank}
                    onCheckedChange={(checked) => setIsFullTank(checked as boolean)}
                  />
                  <Label htmlFor="fullTank" className="font-normal">
                    {t('fuel.fullTankFillUpEfficiency')}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Odometer */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.odometerReading')}</CardTitle>
                <CardDescription>{t('fuel.recordCurrentOdometer')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="odometer">{t('fuel.odometerKm')} *</Label>
                    <Input
                      id="odometer"
                      type="number"
                      min="0"
                      placeholder={t('fuel.enterCurrentOdometer')}
                      value={odometer || ""}
                      onChange={(e) => setOdometer(parseFloat(e.target.value) || 0)}
                      required
                    />
                    {selectedVehicleData && (
                      <p className="text-xs text-muted-foreground">
                        {t('fuel.lastRecorded')}: {selectedVehicleData.currentOdometer.toLocaleString()} km
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.form.paymentInfo')}</CardTitle>
                <CardDescription>{t('fuel.form.paymentDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('fuel.form.paymentMethod')}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder={t('fuel.form.selectMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fuel_card">{t('fuel.form.paymentMethods.fuelCard')}</SelectItem>
                        <SelectItem value="company_card">{t('fuel.form.paymentMethods.companyCard')}</SelectItem>
                        <SelectItem value="cash">{t('fuel.form.paymentMethods.cash')}</SelectItem>
                        <SelectItem value="reimbursement">{t('fuel.form.paymentMethods.reimbursement')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber">{t('fuel.receiptNumber')}</Label>
                    <Input
                      id="receiptNumber"
                      placeholder={t('fuel.receiptPlaceholder')}
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.form.additionalNotes')}</CardTitle>
                <CardDescription>{t('fuel.form.notesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  placeholder={t('fuel.form.notesPlaceholderNew')}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.form.summary')}</CardTitle>
                <CardDescription>{t('fuel.form.summaryDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                  <div className="text-center">
                    <Fuel className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-3xl font-bold tabular-nums">
                      {formatCurrency(totalCost)}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('fuel.totalCost')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('fuel.volume')}</span>
                    <span className="font-medium tabular-nums">{volume.toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('fuel.pricePerLiterFull')}</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(pricePerUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('fuel.fullTank')}</span>
                    <span className="font-medium">{isFullTank ? t('common.yes') : t('common.no')}</span>
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
                    {isSubmitting ? t('common.saving') : t('fuel.form.saveEntry')}
                  </Button>
                  <Button variant="outline" type="button" asChild disabled={isSubmitting}>
                    <Link href="/fleet/fuel">{t('common.cancel')}</Link>
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
