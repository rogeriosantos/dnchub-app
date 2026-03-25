"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Fuel,
  AlertTriangle,
  Wrench,
  Gauge,
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { fuelPumpsService, fuelPumpDeliveriesService } from "@/lib/api";
import { formatDate, formatNumber, formatCurrency } from "@/lib/utils";
import type { FuelPump, FuelPumpDelivery, PumpStatus, FuelType } from "@/types";

// Status badge config
const pumpStatusConfig: Record<PumpStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  active: { variant: "default", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  maintenance: { variant: "outline", label: "Maintenance" },
  out_of_service: { variant: "destructive", label: "Out of Service" },
};

// Fuel type labels
const fuelTypeLabels: Record<FuelType, string> = {
  diesel: "Diesel",
  petrol: "Petrol",
  gasoline: "Gasoline",
  electric: "Electric",
  hybrid: "Hybrid",
  lpg: "LPG",
  cng: "CNG",
};

// Get level color based on percentage
function getLevelColor(percentage: number): string {
  if (percentage <= 20) return "bg-red-500";
  if (percentage <= 40) return "bg-amber-500";
  return "bg-green-500";
}

export default function FuelPumpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pumpId = params.id as string;

  const [pump, setPump] = React.useState<FuelPump | null>(null);
  const [deliveries, setDeliveries] = React.useState<FuelPumpDelivery[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [pumpData, deliveriesData] = await Promise.all([
          fuelPumpsService.getById(pumpId),
          fuelPumpDeliveriesService.getByPump(pumpId, { limit: 50 }),
        ]);

        setPump(pumpData);
        setDeliveries(deliveriesData);
      } catch (err) {
        console.error("Failed to load pump data:", err);
        setError("Failed to load pump data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [pumpId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await fuelPumpsService.delete(pumpId);
      router.push("/fleet/fuel-pumps");
    } catch (err) {
      console.error("Failed to delete pump:", err);
      alert("Failed to delete pump. Please try again.");
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !pump) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error Loading Pump</h2>
        <p className="mt-2 text-muted-foreground">{error || "Pump not found"}</p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/fuel-pumps">Back to Pumps</Link>
        </Button>
      </div>
    );
  }

  const levelPercentage = pump.levelPercentage ?? (pump.capacity > 0 ? (pump.currentLevel / pump.capacity) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/fuel-pumps">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to pumps</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{pump.name}</h1>
              <Badge variant={pumpStatusConfig[pump.status].variant}>
                {pumpStatusConfig[pump.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Code: {pump.code} | {fuelTypeLabels[pump.fuelType]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fleet/fuel-pumps/${pump.id}/deliveries/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Delivery
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/fleet/fuel-pumps/${pump.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Pump</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this pump? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Alert Banner */}
      {(pump.isLowLevel || pump.isMaintenanceDue) && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                {pump.isLowLevel && (
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Low fuel level - consider scheduling a delivery
                  </p>
                )}
                {pump.isMaintenanceDue && (
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Maintenance is due for this pump
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Level</span>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold tabular-nums">{formatNumber(pump.currentLevel)} L</span>
                  <span className="text-sm text-muted-foreground">{levelPercentage.toFixed(0)}%</span>
                </div>
                <Progress
                  value={levelPercentage}
                  className="h-2"
                  // @ts-expect-error - custom indicator class
                  indicatorClassName={getLevelColor(levelPercentage)}
                />
                <p className="text-xs text-muted-foreground">
                  of {formatNumber(pump.capacity)} L capacity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Minimum Level</span>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{formatNumber(pump.minimumLevel)} L</p>
              <p className="text-xs text-muted-foreground">Alert threshold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pump Odometer</span>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{formatNumber(pump.currentOdometer)}</p>
              <p className="text-xs text-muted-foreground">Current reading</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Deliveries</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{deliveries.length}</p>
              <p className="text-xs text-muted-foreground">Recorded deliveries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pump Details */}
            <Card>
              <CardHeader>
                <CardTitle>Pump Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{fuelTypeLabels[pump.fuelType]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={pumpStatusConfig[pump.status].variant}>
                      {pumpStatusConfig[pump.status].label}
                    </Badge>
                  </div>
                </div>
                {pump.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{pump.location}</p>
                    </div>
                  </div>
                )}
                {pump.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{pump.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Maintenance</p>
                      <p className="font-medium">
                        {pump.lastMaintenanceDate ? formatDate(pump.lastMaintenanceDate) : "Not recorded"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Next Maintenance</p>
                      <p className={`font-medium ${pump.isMaintenanceDue ? "text-destructive" : ""}`}>
                        {pump.nextMaintenanceDate ? formatDate(pump.nextMaintenanceDate) : "Not scheduled"}
                      </p>
                    </div>
                  </div>
                </div>
                {pump.maintenanceIntervalDays && (
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance Interval</p>
                    <p className="font-medium">{pump.maintenanceIntervalDays} days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Delivery History</CardTitle>
              <Button asChild>
                <Link href={`/fleet/fuel-pumps/${pump.id}/deliveries/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Delivery
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Price/L</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Level After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No deliveries recorded</p>
                            <Button asChild size="sm" className="mt-2">
                              <Link href={`/fleet/fuel-pumps/${pump.id}/deliveries/new`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Delivery
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell>{formatDate(delivery.deliveryDate)}</TableCell>
                          <TableCell>{delivery.supplier || "—"}</TableCell>
                          <TableCell>{delivery.invoiceNumber || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(delivery.volume)} L
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(delivery.pricePerUnit)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(delivery.totalCost)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(delivery.levelAfter)} L
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
