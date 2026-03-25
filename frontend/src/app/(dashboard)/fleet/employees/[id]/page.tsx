"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  User,
  Phone,
  Mail,
  Calendar,
  IdCard,
  Truck,
  MapPin,
  Clock,
  Star,
  Shield,
  Activity,
  FileText,
  Fuel,
  Receipt,
} from "lucide-react";
import { driversService } from "@/lib/api/drivers";
import { vehiclesService } from "@/lib/api/vehicles";
import { fuelService } from "@/lib/api/fuel";
import { ticketsService } from "@/lib/api/tickets";
import { tripsService } from "@/lib/api/trips";
import { formatDate, formatDistance, formatCurrency, formatFuelVolume, cn, formatDuration } from "@/lib/utils";
import type { Driver, Vehicle, DriverStatus, FuelEntry, Ticket, Trip } from "@/types";

// Status color mapping (labels come from translations)
const driverStatusColors: Record<DriverStatus, { color: string; bgColor: string }> = {
  available: { color: "text-green-700", bgColor: "bg-green-100" },
  on_duty: { color: "text-blue-700", bgColor: "bg-blue-100" },
  off_duty: { color: "text-gray-700", bgColor: "bg-gray-100" },
  on_leave: { color: "text-amber-700", bgColor: "bg-amber-100" },
  suspended: { color: "text-red-700", bgColor: "bg-red-100" },
  on_break: { color: "text-orange-700", bgColor: "bg-orange-100" },
  on_trip: { color: "text-cyan-700", bgColor: "bg-cyan-100" },
};

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const driverId = params.id as string;

  const [driver, setDriver] = React.useState<Driver | null>(null);
  const [assignedVehicle, setAssignedVehicle] = React.useState<Vehicle | null>(null);
  const [fuelEntries, setFuelEntries] = React.useState<FuelEntry[]>([]);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [vehicleMap, setVehicleMap] = React.useState<Record<string, Vehicle>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load driver data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load driver
        const driverData = await driversService.getById(driverId);
        setDriver(driverData);

        // Load assigned vehicle if exists
        if (driverData.assignedVehicleId) {
          try {
            const vehicleData = await vehiclesService.getById(driverData.assignedVehicleId);
            setAssignedVehicle(vehicleData);
          } catch {
            // Vehicle might not exist
            setAssignedVehicle(null);
          }
        }

        // Load fuel entries for this driver
        let fuelData: FuelEntry[] = [];
        try {
          fuelData = await fuelService.getByDriver(driverId, { limit: 50 });
          setFuelEntries(fuelData);
        } catch {
          // Fuel entries may not exist, continue
          setFuelEntries([]);
        }

        // Load vehicles for fuel entries (to display registration plates)
        if (fuelData.length > 0) {
          const uniqueVehicleIds = [...new Set(fuelData.map(entry => entry.vehicleId))];
          const vehiclePromises = uniqueVehicleIds.map(async (id) => {
            try {
              return await vehiclesService.getById(id);
            } catch {
              return null;
            }
          });
          const vehicles = await Promise.all(vehiclePromises);
          const map: Record<string, Vehicle> = {};
          vehicles.forEach((v) => {
            if (v) map[v.id] = v;
          });
          setVehicleMap(map);
        }

        // Load tickets for this driver
        try {
          const ticketsData = await ticketsService.getByDriver(driverId, 0, 50);
          setTickets(ticketsData);
        } catch {
          // Tickets may not exist, continue
          setTickets([]);
        }

        // Load trips for this driver
        try {
          const tripsData = await tripsService.getByDriver(driverId, { limit: 50 });
          setTrips(tripsData);
        } catch {
          // Trips may not exist, continue
          setTrips([]);
        }
      } catch (err) {
        console.error("Failed to load driver:", err);
        setError("Driver not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [driverId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await driversService.delete(driverId);
      router.push("/fleet/employees");
    } catch (err) {
      console.error("Failed to delete driver:", err);
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Not found state
  if (error || !driver) {
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

  const statusColors = driverStatusColors[driver.status] || driverStatusColors.available;

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/employees">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold">
              {driver.firstName[0]}
              {driver.lastName[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {driver.firstName} {driver.lastName}
              </h1>
              <p className="text-muted-foreground">
                {t('drivers.employeeId')}: {driver.employeeId || t('common.notSet')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fleet/employees/${driver.id}/edit`}>
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
                <AlertDialogTitle>{t('drivers.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('drivers.detail.deleteConfirmMessage', { name: `${driver.firstName} ${driver.lastName}` })}
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

      {/* Overview Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", statusColors.bgColor)}>
                <User className={cn("h-5 w-5", statusColors.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                <p className="font-semibold">{t(`drivers.status.${driver.status}`)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.safetyScore')}</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold tabular-nums">
                    {driver.safetyScore !== undefined ? `${driver.safetyScore}%` : t('common.notAvailable')}
                  </p>
                  {driver.safetyScore !== undefined && (
                    <Progress value={driver.safetyScore} className="w-12 h-2" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.assignedVehicle')}</p>
                <p className="font-semibold">
                  {assignedVehicle ? assignedVehicle.registrationPlate : t('common.none')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.totalTrips')}</p>
                <p className="font-semibold tabular-nums">{trips.length || driver.totalTrips || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards - Row 2: Fuel & Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Fuel className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.totalFuelCost')}</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(fuelEntries.reduce((sum, entry) => sum + entry.totalCost, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Fuel className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.totalFuelVolume')}</p>
                <p className="font-semibold tabular-nums">
                  {formatFuelVolume(fuelEntries.reduce((sum, entry) => sum + entry.volume, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <MapPin className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.totalDistance')}</p>
                <p className="font-semibold tabular-nums">
                  {formatDistance(trips.reduce((sum, trip) => sum + (trip.distance || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <Receipt className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drivers.totalTicketsFines')}</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(tickets.reduce((sum, ticket) => sum + ticket.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">{t('drivers.tabs.details')}</TabsTrigger>
          <TabsTrigger value="trips">{t('drivers.tabs.trips')}</TabsTrigger>
          <TabsTrigger value="fuel">{t('drivers.tabs.fuel')}</TabsTrigger>
          <TabsTrigger value="tickets">{t('drivers.tabs.tickets')}</TabsTrigger>
          <TabsTrigger value="documents">{t('drivers.tabs.documents')}</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.personalInfo')}</CardTitle>
                <CardDescription>{t('drivers.personalDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.firstName')}</p>
                    <p className="font-medium">{driver.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.lastName')}</p>
                    <p className="font-medium">{driver.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.dateOfBirth')}</p>
                    <p className="font-medium">
                      {driver.dateOfBirth ? formatDate(driver.dateOfBirth) : t('common.notSet')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.employeeId')}</p>
                    <p className="font-medium font-mono">
                      {driver.employeeId || t('common.notSet')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{driver.phone}</span>
                  </div>
                  {driver.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{driver.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.licenseInfo')}</CardTitle>
                <CardDescription>{t('drivers.drivingLicenseInfo')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.licenseNumber')}</p>
                    <p className="font-medium font-mono">{driver.licenseNumber || t('common.notSet')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.licenseClass')}</p>
                    <p className="font-medium">{driver.licenseClass ? t(`drivers.licenseClass.${driver.licenseClass}`) : t('common.notSet')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.detail.issueDate')}</p>
                    <p className="font-medium">
                      {driver.licenseIssueDate
                        ? formatDate(driver.licenseIssueDate)
                        : t('common.notSet')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.detail.expiryDate')}</p>
                    <p className="font-medium">
                      {driver.licenseExpiry ? formatDate(driver.licenseExpiry) : t('common.notSet')}
                    </p>
                  </div>
                </div>
                {driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date() && (
                  <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {t('drivers.detail.licenseExpired')}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {t('drivers.detail.renewLicenseMessage')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.assignedVehicle')}</CardTitle>
                <CardDescription>{t('drivers.detail.currentlyAssignedVehicle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {assignedVehicle ? (
                  <Link
                    href={`/fleet/vehicles/${assignedVehicle.id}`}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                      <Truck className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{assignedVehicle.registrationPlate}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignedVehicle.make} {assignedVehicle.model} ({assignedVehicle.year})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('vehicles.odometer')}: {formatDistance(assignedVehicle.currentOdometer)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {t(`vehicles.status.${assignedVehicle.status}`)}
                    </Badge>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                    <Truck className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 font-medium">{t('drivers.noVehicleAssigned')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('drivers.detail.assignVehicleToDriver')}
                    </p>
                    <Button className="mt-4" variant="outline" asChild>
                      <Link href={`/fleet/employees/${driver.id}/edit`}>{t('drivers.detail.assignVehicle')}</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('drivers.form.employmentInfo')}</CardTitle>
                <CardDescription>{t('drivers.form.employmentDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.hireDate')}</p>
                    <p className="font-medium">
                      {driver.hireDate ? formatDate(driver.hireDate) : t('common.notSet')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                    <Badge variant="outline" className="capitalize">
                      {t(`drivers.status.${driver.status}`)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.emergencyContact')}</p>
                    <p className="font-medium">{driver.emergencyContact || t('common.notSet')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('drivers.emergencyPhone')}</p>
                    <p className="font-medium">{driver.emergencyPhone || t('common.notSet')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trip History Tab */}
        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('drivers.detail.tripHistory')}</CardTitle>
              <CardDescription>{t('drivers.detail.allTripsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <MapPin className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t('drivers.detail.noTripRecords')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('fuel.vehicle')}</TableHead>
                        <TableHead>{t('trips.startLocation')}</TableHead>
                        <TableHead>{t('trips.endLocation')}</TableHead>
                        <TableHead className="text-right">{t('trips.distance')}</TableHead>
                        <TableHead className="text-right">{t('trips.duration')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            <p className="font-medium">{formatDate(trip.startTime)}</p>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/fleet/vehicles/${trip.vehicleId}`}
                              className="hover:underline"
                            >
                              {trip.vehicleId.slice(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {trip.startLocation.latitude.toFixed(4)}, {trip.startLocation.longitude.toFixed(4)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {trip.endLocation ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {trip.endLocation.latitude.toFixed(4)}, {trip.endLocation.longitude.toFixed(4)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {trip.distance ? formatDistance(trip.distance) : '-'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {trip.duration ? formatDuration(trip.duration) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trip.endTime ? "outline" : "default"}>
                              {trip.endTime ? t('trips.completed') : t('trips.inProgress')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fuel Records Tab */}
        <TabsContent value="fuel" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('drivers.detail.fuelRecords')}</CardTitle>
                <CardDescription>{t('drivers.detail.fuelEntriesDescription')}</CardDescription>
              </div>
              <Button asChild>
                <Link href="/fleet/fuel/log">
                  <Fuel className="mr-2 h-4 w-4" />
                  {t('fuel.logFuel')}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {fuelEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Fuel className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t('drivers.detail.noFuelRecords')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('fuel.vehicle')}</TableHead>
                        <TableHead>{t('fuel.fuelType')}</TableHead>
                        <TableHead>{t('fuel.station')}</TableHead>
                        <TableHead className="text-right">{t('fuel.volume')}</TableHead>
                        <TableHead className="text-right">{t('fuel.totalCost')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Link
                              href={`/fleet/fuel/${entry.id}`}
                              className="font-medium hover:underline"
                            >
                              {formatDate(entry.date)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/fleet/vehicles/${entry.vehicleId}`}
                              className="hover:underline font-medium"
                            >
                              {vehicleMap[entry.vehicleId]?.registrationPlate || entry.vehicleId.slice(0, 8) + '...'}
                            </Link>
                          </TableCell>
                          <TableCell className="capitalize">{t(`fuel.types.${entry.fuelType}`)}</TableCell>
                          <TableCell>{entry.station || t('common.notAvailable')}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatFuelVolume(entry.volume)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(entry.totalCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('tickets.trafficTickets')}</CardTitle>
                <CardDescription>{t('drivers.detail.ticketsDescription')}</CardDescription>
              </div>
              <Button asChild>
                <Link href="/fleet/tickets/new">
                  <Receipt className="mr-2 h-4 w-4" />
                  {t('tickets.addTicket')}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Receipt className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t('drivers.detail.noTicketsFound')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('drivers.detail.noTrafficViolations')}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('tickets.ticketNumber')}</TableHead>
                        <TableHead>{t('common.type')}</TableHead>
                        <TableHead>{t('tickets.location')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead className="text-right">{t('tickets.amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <Link
                              href={`/fleet/tickets/${ticket.id}`}
                              className="font-medium hover:underline"
                            >
                              {formatDate(ticket.violationDate)}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {ticket.ticketNumber || ticket.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {t(`tickets.types.${ticket.type}`)}
                          </TableCell>
                          <TableCell>{ticket.violationLocation || t('common.notAvailable')}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "paid"
                                  ? "outline"
                                  : ticket.status === "overdue"
                                  ? "destructive"
                                  : ticket.status === "cancelled"
                                  ? "secondary"
                                  : "default"
                              }
                              className="capitalize"
                            >
                              {t(`tickets.status.${ticket.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(ticket.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('drivers.detail.documents')}</CardTitle>
                <CardDescription>{t('drivers.detail.documentsDescription')}</CardDescription>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                {t('drivers.detail.uploadDocument')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">{t('drivers.detail.noDocuments')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('drivers.detail.uploadDocumentsHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
