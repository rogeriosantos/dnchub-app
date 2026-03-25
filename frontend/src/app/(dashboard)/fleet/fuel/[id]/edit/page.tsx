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
import type { FuelType, Vehicle, Driver, FuelEntry } from "@/types";

const fuelTypeValues: FuelType[] = ["gasoline", "diesel", "electric", "hybrid", "lpg", "cng"];

export default function EditFuelPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const entryId = params.id as string;

  const [entry, setEntry] = React.useState<FuelEntry | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("");
  const [selectedDriver, setSelectedDriver] = React.useState<string>("");
  const [date, setDate] = React.useState<string>("");
  const [time, setTime] = React.useState<string>("");
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

        const [entryData, vehiclesData, driversData] = await Promise.all([
          fuelService.getById(entryId),
          vehiclesService.getAll({ limit: 500 }),
          driversService.getAll({ limit: 500 }),
        ]);

        setEntry(entryData);
        setVehicles(vehiclesData);
        setDrivers(driversData);

        // Populate form with existing data
        setSelectedVehicle(entryData.vehicleId);
        setSelectedDriver(entryData.driverId || "");
        setDate(entryData.date);
        setTime(entryData.time || "");
        setFuelType(entryData.fuelType);
        setStation(entryData.station || "");
        setVolume(entryData.volume);
        setPricePerUnit(entryData.pricePerUnit);
        setOdometer(entryData.odometer);
        setIsFullTank(entryData.fullTank);
        setReceiptNumber(entryData.receiptNumber || "");
        setNotes(entryData.notes || "");
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(t('fuel.errors.failedToLoadEntry'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [entryId]);

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

      await fuelService.update(entryId, {
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

      router.push(`/fuel/${entryId}`);
    } catch (err) {
      console.error("Failed to update fuel entry:", err);
      setSubmitError(t('fuel.errors.failedToSaveChanges'));
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
            {[...Array(2)].map((_, i) => (
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

  if (error || !entry) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">{t('fuel.errors.entryNotFound')}</h2>
        <p className="mt-2 text-muted-foreground">
          {error || t('fuel.errors.entryNotFoundDescription')}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/fuel">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('fuel.backToFuel')}
          </Link>
        </Button>
      </div>
    );
  }

  // Get selected vehicle data
  const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);

  // Track original vehicle to detect user changes
  const originalVehicleRef = React.useRef<string | null>(null);

  // Set original vehicle ref after initial load
  React.useEffect(() => {
    if (entry && originalVehicleRef.current === null) {
      originalVehicleRef.current = entry.vehicleId;
    }
  }, [entry]);

  // When user changes vehicle, pre-fill with the new vehicle's assigned driver
  React.useEffect(() => {
    if (
      selectedVehicleData &&
      originalVehicleRef.current !== null &&
      selectedVehicle !== originalVehicleRef.current
    ) {
      // User changed the vehicle - update driver to new vehicle's assigned driver
      if (selectedVehicleData.assignedDriverId) {
        setSelectedDriver(selectedVehicleData.assignedDriverId);
      }
    }
  }, [selectedVehicle, selectedVehicleData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/fuel/${entryId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('fuel.form.editTitle')}</h1>
          <p className="text-muted-foreground">{t('fuel.form.editSubtitle')}</p>
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
                <CardDescription>{t('fuel.form.updateFuelDetails')}</CardDescription>
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
                    {t('fuel.fullTankFillUp')}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Odometer */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fuel.odometerReading')}</CardTitle>
                <CardDescription>{t('fuel.recordOdometer')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="odometer">{t('fuel.odometerKm')} *</Label>
                    <Input
                      id="odometer"
                      type="number"
                      min="0"
                      placeholder={t('fuel.enterOdometer')}
                      value={odometer || ""}
                      onChange={(e) => setOdometer(parseFloat(e.target.value) || 0)}
                      required
                    />
                    {selectedVehicleData && (
                      <p className="text-xs text-muted-foreground">
                        {t('fuel.vehicleCurrent')}: {selectedVehicleData.currentOdometer.toLocaleString()} km
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
                  placeholder={t('fuel.form.notesPlaceholder')}
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
                    {isSubmitting ? t('common.saving') : t('fuel.form.saveChanges')}
                  </Button>
                  <Button variant="outline" type="button" asChild disabled={isSubmitting}>
                    <Link href={`/fuel/${entryId}`}>{t('common.cancel')}</Link>
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
