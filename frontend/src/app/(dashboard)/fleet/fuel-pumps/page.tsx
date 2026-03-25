"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Fuel,
  AlertTriangle,
  Wrench,
  Gauge,
  Container,
  TrendingUp,
  Package,
} from "lucide-react";
import { fuelPumpsService } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { FuelPump, FuelPumpStats, PumpStatus, FuelType } from "@/types";

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

export default function FuelPumpsPage() {
  const [pumps, setPumps] = React.useState<FuelPump[]>([]);
  const [stats, setStats] = React.useState<FuelPumpStats | null>(null);
  const [alertPumps, setAlertPumps] = React.useState<FuelPump[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [fuelTypeFilter, setFuelTypeFilter] = React.useState<string>("all");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Handler to delete a pump
  const handleDeletePump = async (pumpId: string) => {
    if (!confirm("Are you sure you want to delete this pump?")) {
      return;
    }
    try {
      setActionLoading(pumpId);
      await fuelPumpsService.delete(pumpId);
      setPumps((prev) => prev.filter((p) => p.id !== pumpId));
      // Refresh stats
      const newStats = await fuelPumpsService.getStats();
      setStats(newStats);
    } catch (err) {
      console.error("Failed to delete pump:", err);
      alert("Failed to delete pump. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Load data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [pumpsData, statsData, alertsData] = await Promise.all([
          fuelPumpsService.getAll({ limit: 500 }),
          fuelPumpsService.getStats(),
          fuelPumpsService.getAlerts(),
        ]);

        setPumps(pumpsData);
        setStats(statsData);
        setAlertPumps(alertsData);
      } catch (err) {
        console.error("Failed to load pumps data:", err);
        setError("Failed to load pumps data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter pumps
  const filteredPumps = pumps.filter((pump) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      pump.name.toLowerCase().includes(searchLower) ||
      pump.code.toLowerCase().includes(searchLower) ||
      pump.location?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || pump.status === statusFilter;
    const matchesFuelType = fuelTypeFilter === "all" || pump.fuelType === fuelTypeFilter;

    return matchesSearch && matchesStatus && matchesFuelType;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-14 w-full" />
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
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error Loading Data</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Pumps</h1>
          <p className="text-muted-foreground">
            Manage in-house fuel pumps and track inventory levels
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/fuel-pumps/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Pump
          </Link>
        </Button>
      </div>

      {/* Alert Banner */}
      {alertPumps.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription>
            {alertPumps.filter(p => p.isLowLevel).length > 0 && (
              <span>{alertPumps.filter(p => p.isLowLevel).length} pump(s) have low fuel levels. </span>
            )}
            {alertPumps.filter(p => p.isMaintenanceDue).length > 0 && (
              <span>{alertPumps.filter(p => p.isMaintenanceDue).length} pump(s) require maintenance.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Container className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPumps ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Pumps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activePumps ?? 0}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.alertsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatNumber(stats?.totalCapacity ?? 0)} L</p>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-100 p-2 dark:bg-cyan-900/20">
                <Gauge className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatNumber(stats?.totalCurrentLevel ?? 0)} L</p>
                <p className="text-xs text-muted-foreground">Current Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pumps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(pumpStatusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Fuel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(fuelTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPumps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Fuel className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No pumps found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPumps.map((pump) => {
                    const levelPercentage = pump.levelPercentage ?? (pump.capacity > 0 ? (pump.currentLevel / pump.capacity) * 100 : 0);
                    return (
                      <TableRow key={pump.id}>
                        <TableCell>
                          <Link
                            href={`/fleet/fuel-pumps/${pump.id}`}
                            className="font-medium hover:underline"
                          >
                            {pump.name}
                          </Link>
                          {pump.location && (
                            <p className="text-xs text-muted-foreground">{pump.location}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{pump.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {fuelTypeLabels[pump.fuelType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="tabular-nums">{formatNumber(pump.currentLevel)} L</span>
                              <span className="text-muted-foreground">{levelPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress
                              value={levelPercentage}
                              className="h-2"
                              // @ts-expect-error - custom indicator class
                              indicatorClassName={getLevelColor(levelPercentage)}
                            />
                            {pump.isLowLevel && (
                              <div className="flex items-center gap-1 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                Low Level
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">{formatNumber(pump.capacity)} L</TableCell>
                        <TableCell className="tabular-nums">{formatNumber(pump.currentOdometer)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={pumpStatusConfig[pump.status].variant}>
                              {pumpStatusConfig[pump.status].label}
                            </Badge>
                            {pump.isMaintenanceDue && (
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                <Wrench className="h-3 w-3" />
                                Maintenance Due
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/fuel-pumps/${pump.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/fuel-pumps/${pump.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Pump
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/fuel-pumps/${pump.id}/deliveries/new`}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Delivery
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePump(pump.id)}
                                disabled={actionLoading === pump.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {actionLoading === pump.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
