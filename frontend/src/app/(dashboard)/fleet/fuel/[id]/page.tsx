"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Fuel,
  Truck,
  User,
  DollarSign,
  Droplets,
  Gauge,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { fuelService, vehiclesService, driversService } from "@/lib/api";
import { formatDate, formatCurrency, formatFuelVolume, formatDistance, cn } from "@/lib/utils";
import type { FuelEntry, FuelType, Vehicle, Driver } from "@/types";

// Fuel type colors
const fuelTypeColors: Record<FuelType, { bg: string; text: string }> = {
  petrol: { bg: "bg-amber-100", text: "text-amber-700" },
  gasoline: { bg: "bg-amber-100", text: "text-amber-700" },
  diesel: { bg: "bg-slate-100", text: "text-slate-700" },
  electric: { bg: "bg-green-100", text: "text-green-700" },
  hybrid: { bg: "bg-blue-100", text: "text-blue-700" },
  lpg: { bg: "bg-purple-100", text: "text-purple-700" },
  cng: { bg: "bg-cyan-100", text: "text-cyan-700" },
};

export default function FuelDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const [entry, setEntry] = React.useState<FuelEntry | null>(null);
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [driver, setDriver] = React.useState<Driver | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const entryData = await fuelService.getById(entryId);
        setEntry(entryData);

        // Load vehicle and driver in parallel
        const [vehicleData, driverData] = await Promise.all([
          vehiclesService.getById(entryData.vehicleId).catch(() => null),
          entryData.driverId
            ? driversService.getById(entryData.driverId).catch(() => null)
            : Promise.resolve(null),
        ]);

        setVehicle(vehicleData);
        setDriver(driverData);
      } catch (err) {
        console.error("Failed to load fuel entry:", err);
        setError(t('fuel.errors.failedToLoadEntry'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [entryId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await fuelService.delete(entryId);
      router.push("/fleet/fuel");
    } catch (err) {
      console.error("Failed to delete fuel entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-32 mt-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">{t('fuel.entryNotFound')}</h2>
        <p className="mt-2 text-muted-foreground">
          {error || t('fuel.entryNotFoundDescription')}
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

  const fuelColors = fuelTypeColors[entry.fuelType] || { bg: "bg-gray-100", text: "text-gray-700" };

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/fuel">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('fuel.detail.title')}</h1>
            <p className="text-muted-foreground">
              {formatDate(entry.date)} {vehicle ? `• ${vehicle.registrationPlate}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fleet/fuel/${entry.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? t('common.deleting') : t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('fuel.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('fuel.deleteConfirmDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.totalCost')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(entry.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.volume')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatFuelVolume(entry.volume)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.pricePerLiter')}</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(entry.pricePerUnit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <Gauge className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.odometer')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatDistance(entry.odometer)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('fuel.detail.fuelDetails')}</CardTitle>
            <CardDescription>{t('fuel.detail.fuelDetailsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.date')}</p>
                <p className="font-medium">{formatDate(entry.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.filter.fuelType')}</p>
                <Badge className={cn(fuelColors.bg, fuelColors.text, "mt-1")}>
                  {t(`fuel.fuelTypes.${entry.fuelType}`)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.station')}</p>
                <p className="font-medium">{entry.station || t('fuel.notSpecified')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.fullTank')}</p>
                <p className="font-medium">{entry.fullTank ? t('common.yes') : t('common.no')}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.volume')}</p>
                <p className="font-medium tabular-nums">{formatFuelVolume(entry.volume)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.unitPrice')}</p>
                <p className="font-medium tabular-nums">{formatCurrency(entry.pricePerUnit)}/L</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.totalCost')}</p>
                <p className="font-medium tabular-nums">{formatCurrency(entry.totalCost)}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.odometerAtFill')}</p>
                <p className="font-medium tabular-nums">{formatDistance(entry.odometer)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.receiptNumber')}</p>
                <p className="font-medium font-mono">{entry.receiptNumber || t('common.notAvailable')}</p>
              </div>
            </div>
            {entry.fuelEfficiency && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fuel.distanceSinceLastFill')}</p>
                    <p className="font-medium tabular-nums">
                      {entry.distance ? formatDistance(entry.distance) : t('common.notAvailable')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fuel.fuelEfficiency')}</p>
                    <p className="font-medium tabular-nums">{entry.fuelEfficiency.toFixed(2)} km/L</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>{t('fuel.detail.vehicleCard')}</CardTitle>
            <CardDescription>{t('fuel.detail.vehicleDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicle ? (
              <Link
                href={`/fleet/vehicles/${vehicle.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                  <Truck className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{vehicle.registrationPlate}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('fuel.filter.fuelType')}: {t(`fuel.fuelTypes.${vehicle.fuelType}`)} {vehicle.fuelCapacity ? `• ${t('vehicles.fuelCapacity')}: ${vehicle.fuelCapacity}L` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {t(`vehicles.status.${vehicle.status}`)}
                </Badge>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                <Truck className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 font-medium">{t('fuel.detail.vehicleNotFound')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('fuel.detail.vehicleNotFoundDescription')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver */}
        <Card>
          <CardHeader>
            <CardTitle>{t('fuel.detail.driverCard')}</CardTitle>
            <CardDescription>{t('fuel.detail.driverDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {driver ? (
              <Link
                href={`/fleet/employees/${driver.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold">
                  {driver.firstName[0]}
                  {driver.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{driver.email}</p>
                  <p className="text-sm text-muted-foreground">{driver.phone}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {t(`drivers.status.${driver.status}`)}
                </Badge>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                <User className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 font-medium">{t('fuel.detail.noDriverAssigned')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('fuel.detail.noDriverDescription')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('fuel.detail.notes')}</CardTitle>
            <CardDescription>{t('fuel.detail.notesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {entry.notes ? (
              <p className="text-sm">{entry.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('fuel.detail.noNotes')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
