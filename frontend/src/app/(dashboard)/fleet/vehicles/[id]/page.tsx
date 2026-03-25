"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  MapPin,
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { vehiclesService } from "@/lib/api/vehicles";
import { driversService } from "@/lib/api/drivers";
import { fuelService } from "@/lib/api/fuel";
import { maintenanceService } from "@/lib/api/maintenance";
import { ticketsService } from "@/lib/api/tickets";
import { formatDistance, formatDate, formatCurrency, formatFuelVolume, cn } from "@/lib/utils";
import type { Vehicle, Driver, VehicleStatus, MaintenanceStatus, MaintenanceTask, FuelEntry, Ticket } from "@/types";

// Status color mapping (labels come from translations)
const vehicleStatusColors: Record<VehicleStatus, { color: string; bgColor: string }> = {
  active: { color: "text-green-700", bgColor: "bg-green-100" },
  in_transit: { color: "text-blue-700", bgColor: "bg-blue-100" },
  maintenance: { color: "text-amber-700", bgColor: "bg-amber-100" },
  idle: { color: "text-gray-700", bgColor: "bg-gray-100" },
  out_of_service: { color: "text-red-700", bgColor: "bg-red-100" },
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [assignedDriver, setAssignedDriver] = React.useState<Driver | null>(null);
  const [fuelEntries, setFuelEntries] = React.useState<FuelEntry[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = React.useState<MaintenanceTask[]>([]);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load vehicle data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load vehicle
        const vehicleData = await vehiclesService.getById(vehicleId);
        setVehicle(vehicleData);

        // Load assigned driver if exists via assignedDriverId
        if (vehicleData.assignedDriverId) {
          try {
            const driverData = await driversService.getById(vehicleData.assignedDriverId);
            setAssignedDriver(driverData);
          } catch {
            // Driver might not exist, try alternative method
            setAssignedDriver(null);
          }
        }

        // Also check for driver who has THIS vehicle assigned (handles inconsistent data)
        if (!vehicleData.assignedDriverId) {
          const driverByVehicle = await driversService.getByVehicle(vehicleId);
          if (driverByVehicle) {
            setAssignedDriver(driverByVehicle);
          }
        }

        // Load fuel entries for this vehicle
        try {
          const fuelData = await fuelService.getByVehicle(vehicleId, { limit: 50 });
          setFuelEntries(fuelData);
        } catch {
          // Fuel entries may not exist, continue
          setFuelEntries([]);
        }

        // Load maintenance tasks for this vehicle
        try {
          const maintenanceData = await maintenanceService.getAll({ vehicle_id: vehicleId, limit: 50 });
          setMaintenanceTasks(maintenanceData);
        } catch {
          // Maintenance tasks may not exist, continue
          setMaintenanceTasks([]);
        }

        // Load tickets for this vehicle
        try {
          const ticketsData = await ticketsService.getByVehicle(vehicleId, 0, 50);
          setTickets(ticketsData);
        } catch {
          // Tickets may not exist, continue
          setTickets([]);
        }
      } catch (err) {
        console.error("Failed to load vehicle:", err);
        setError("Vehicle not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vehicleId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await vehiclesService.delete(vehicleId);
      router.push("/fleet/vehicles");
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
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
  if (error || !vehicle) {
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

  const statusColors = vehicleStatusColors[vehicle.status] || vehicleStatusColors.active;

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{vehicle.registrationPlate}</h1>
            <p className="text-muted-foreground">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fleet/vehicles/${vehicle.id}/edit`}>
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
                <AlertDialogTitle>{t('vehicles.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('vehicles.deleteConfirmDescription', { plate: vehicle.registrationPlate })}
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
              <div className={cn("rounded-lg p-2", statusColors.bgColor)}>
                <Truck className={cn("h-5 w-5", statusColors.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                <p className="font-semibold">{t(`vehicles.status.${vehicle.status}`)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('vehicles.odometer')}</p>
                <p className="font-semibold tabular-nums">{formatDistance(vehicle.currentOdometer)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Fuel className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('vehicles.fuelCostTotal')}</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(
                    vehicle.totalFuelCost ?? fuelEntries.reduce((sum, entry) => sum + entry.totalCost, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('vehicles.maintenanceCost')}</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(maintenanceTasks.reduce((sum, task) => sum + (Number(task.actualCost) || Number(task.estimatedCost) || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
          <TabsTrigger value="maintenance">{t('tabs.maintenance')}</TabsTrigger>
          <TabsTrigger value="fuel">{t('tabs.fuelHistory')}</TabsTrigger>
          <TabsTrigger value="tickets">{t('tabs.tickets')}</TabsTrigger>
          <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.vehicleInformation')}</CardTitle>
                <CardDescription>{t('vehicles.basicDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.registrationPlate')}</p>
                    <p className="font-medium">{vehicle.registrationPlate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.vin')}</p>
                    <p className="font-medium font-mono text-sm">{vehicle.vin || t('common.notAvailable')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.make')}</p>
                    <p className="font-medium">{vehicle.make}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.model')}</p>
                    <p className="font-medium">{vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.year')}</p>
                    <p className="font-medium">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.color')}</p>
                    <p className="font-medium">{vehicle.color || t('common.notAvailable')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.type')}</p>
                    <p className="font-medium">{t(`vehicles.types.${vehicle.type}`)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.fuelType')}</p>
                    <p className="font-medium">{t(`fuel.types.${vehicle.fuelType}`)}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.fuelCapacity')}</p>
                    <p className="font-medium">{vehicle.fuelCapacity ? formatFuelVolume(vehicle.fuelCapacity) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.currentOdometer')}</p>
                    <p className="font-medium tabular-nums">{formatDistance(vehicle.currentOdometer)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Driver */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.assignedDriver')}</CardTitle>
                <CardDescription>{t('vehicles.assignedDriverDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {assignedDriver ? (
                  <Link
                    href={`/fleet/employees/${assignedDriver.id}`}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-medium">
                      {assignedDriver.firstName[0]}
                      {assignedDriver.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {assignedDriver.firstName} {assignedDriver.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{assignedDriver.email}</p>
                      <p className="text-sm text-muted-foreground">{assignedDriver.phone}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {t(`drivers.status.${assignedDriver.status}`)}
                    </Badge>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                    <User className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 font-medium">{t('vehicles.noDriverAssigned')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('vehicles.assignDriverPrompt')}
                    </p>
                    <Button className="mt-4" variant="outline" asChild>
                      <Link href={`/fleet/vehicles/${vehicle.id}/edit`}>{t('vehicles.assignDriver')}</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.serviceInformation')}</CardTitle>
                <CardDescription>{t('vehicles.serviceSchedule')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.nextServiceDate')}</p>
                    <p className="font-medium">
                      {vehicle.nextServiceDate ? formatDate(vehicle.nextServiceDate) : t('common.notScheduled')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.nextServiceOdometer')}</p>
                    <p className="font-medium tabular-nums">
                      {vehicle.nextServiceOdometer
                        ? formatDistance(vehicle.nextServiceOdometer)
                        : t('common.notSet')}
                    </p>
                  </div>
                </div>
                {vehicle.nextServiceDate && (
                  <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {t('vehicles.serviceDueSoon')}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                      {t('vehicles.scheduleMaintenanceBefore', { date: formatDate(vehicle.nextServiceDate) })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration & Insurance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicles.registrationInsurance')}</CardTitle>
                <CardDescription>{t('vehicles.legalInsurance')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.registrationExpiry')}</p>
                    <p className="font-medium">
                      {vehicle.registrationExpiry
                        ? formatDate(vehicle.registrationExpiry)
                        : t('common.notSet')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.insuranceExpiry')}</p>
                    <p className="font-medium">
                      {vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : t('common.notSet')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.insuranceProvider')}</p>
                    <p className="font-medium">{vehicle.insuranceProvider || t('common.notSet')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('vehicles.policyNumber')}</p>
                    <p className="font-medium font-mono text-sm">
                      {vehicle.insurancePolicyNumber || t('common.notSet')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('vehicles.maintenanceHistory')}</CardTitle>
                <CardDescription>{t('vehicles.allMaintenanceTasks')}</CardDescription>
              </div>
              <Button asChild>
                <Link href="/fleet/maintenance/new">
                  <Wrench className="mr-2 h-4 w-4" />
                  {t('dashboard.scheduleMaintenance')}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {maintenanceTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Wrench className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t('vehicles.noMaintenanceRecords')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('table.title')}</TableHead>
                        <TableHead>{t('common.type')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('table.priority')}</TableHead>
                        <TableHead>{t('table.scheduledDate')}</TableHead>
                        <TableHead className="text-right">{t('table.cost')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Link
                              href={`/fleet/maintenance/${task.id}`}
                              className="font-medium hover:underline"
                            >
                              {task.title}
                            </Link>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {task.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{task.type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "outline"
                                  : task.status === "overdue"
                                  ? "destructive"
                                  : task.status === "in_progress"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {task.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                task.priority === "high"
                                  ? "destructive"
                                  : task.priority === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.scheduledDate ? formatDate(task.scheduledDate) : "Not scheduled"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {task.actualCost
                              ? formatCurrency(Number(task.actualCost))
                              : task.estimatedCost
                              ? formatCurrency(Number(task.estimatedCost))
                              : "—"}
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

        {/* Fuel Tab */}
        <TabsContent value="fuel" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('vehicles.fuelHistory')}</CardTitle>
                <CardDescription>{t('vehicles.fuelEntriesConsumption')}</CardDescription>
              </div>
              <Button asChild>
                <Link href="/fleet/fuel/log">
                  <Fuel className="mr-2 h-4 w-4" />
                  {t('vehicles.logFuel')}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {fuelEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Fuel className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t('vehicles.noFuelRecords')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('vehicles.fuelType')}</TableHead>
                        <TableHead>{t('fuel.station')}</TableHead>
                        <TableHead className="text-right">{t('fuel.volume')}</TableHead>
                        <TableHead className="text-right">{t('fuel.pricePerLiter')}</TableHead>
                        <TableHead className="text-right">{t('fuel.totalCost')}</TableHead>
                        <TableHead className="text-right">{t('vehicles.odometer')}</TableHead>
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
                          <TableCell className="capitalize">{entry.fuelType}</TableCell>
                          <TableCell>{entry.station || "N/A"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatFuelVolume(entry.volume)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(entry.pricePerUnit)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(entry.totalCost)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatDistance(entry.odometer)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3}>{t('common.total')}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatFuelVolume(fuelEntries.reduce((sum, entry) => sum + entry.volume, 0))}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(fuelEntries.reduce((sum, entry) => sum + entry.totalCost, 0))}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
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
                <CardTitle>{t('vehicles.trafficTickets')}</CardTitle>
                <CardDescription>{t('vehicles.ticketsDescription')}</CardDescription>
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
                  <p className="mt-2 text-muted-foreground">{t('vehicles.noTicketsFound')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('vehicles.noTicketsDescription')}
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
                        <TableHead>{t('tickets.driver')}</TableHead>
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
                          <TableCell>
                            {t(`tickets.types.${ticket.type}`)}
                          </TableCell>
                          <TableCell>
                            {ticket.driverId ? (
                              <Link
                                href={`/fleet/employees/${ticket.driverId}`}
                                className="hover:underline"
                              >
                                {t('vehicles.viewDriver')}
                              </Link>
                            ) : (
                              t('common.notAvailable')
                            )}
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
                <CardTitle>{t('vehicles.documents')}</CardTitle>
                <CardDescription>{t('vehicles.documentsDescription')}</CardDescription>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                {t('vehicles.uploadDocument')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">{t('vehicles.noDocuments')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('vehicles.uploadDocuments')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
