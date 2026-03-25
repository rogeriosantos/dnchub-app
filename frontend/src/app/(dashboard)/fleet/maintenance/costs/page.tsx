"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  Wrench,
  Download,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { maintenanceService, vehiclesService } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import type { MaintenanceTask, Vehicle } from "@/types";

interface VehicleCostData {
  id: string;
  registrationPlate: string;
  make: string;
  model: string;
  currentOdometer: number;
  totalCost: number;
  laborCost: number;
  partsCost: number;
  serviceCount: number;
  costPerKm: string;
}

interface CostCategory {
  name: string;
  type: string;
  amount: number;
  percentage: number;
}

export default function MaintenanceCostsPage() {
  const [tasks, setTasks] = React.useState<MaintenanceTask[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState("month");
  const [sortBy, setSortBy] = React.useState("totalCost");

  // Load data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [tasksData, vehiclesData] = await Promise.all([
          maintenanceService.getAll({ limit: 500 }),
          vehiclesService.getAll({ limit: 500 }),
        ]);

        setTasks(tasksData);
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Failed to load cost data:", err);
        setError("Failed to load cost analysis data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter tasks by time range
  const getFilteredTasks = React.useCallback(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return tasks.filter((task) => {
      const taskDate = task.completedDate ? new Date(task.completedDate) :
                       task.scheduledDate ? new Date(task.scheduledDate) : null;
      return taskDate && taskDate >= startDate;
    });
  }, [tasks, timeRange]);

  // Calculate vehicle cost analysis
  const vehicleCostAnalysis: VehicleCostData[] = React.useMemo(() => {
    const filteredTasks = getFilteredTasks();

    return vehicles.map((vehicle) => {
      const vehicleTasks = filteredTasks.filter((t) => t.vehicleId === vehicle.id);
      const totalCost = vehicleTasks.reduce((acc, t) =>
        acc + (Number(t.actualCost) || Number(t.estimatedCost) || 0), 0);
      const laborCost = vehicleTasks.reduce((acc, t) =>
        acc + (Number(t.laborCost) || 0), 0);
      const partsCost = vehicleTasks.reduce((acc, t) =>
        acc + (Number(t.partsCost) || 0), 0);
      const odometer = Number(vehicle.currentOdometer) || 1;

      return {
        id: vehicle.id,
        registrationPlate: vehicle.registrationPlate,
        make: vehicle.make,
        model: vehicle.model,
        currentOdometer: odometer,
        totalCost,
        laborCost: laborCost || totalCost * 0.4, // Estimate if not available
        partsCost: partsCost || totalCost * 0.6, // Estimate if not available
        serviceCount: vehicleTasks.length,
        costPerKm: odometer > 0 ? ((totalCost / odometer) * 1000).toFixed(2) : "0.00",
      };
    }).filter((v) => v.serviceCount > 0 || v.totalCost > 0);
  }, [vehicles, getFilteredTasks]);

  // Calculate cost categories from task types
  const costCategories: CostCategory[] = React.useMemo(() => {
    const filteredTasks = getFilteredTasks();
    const categoryMap: Record<string, number> = {};

    filteredTasks.forEach((task) => {
      const type = task.type || "other";
      const cost = Number(task.actualCost) || Number(task.estimatedCost) || 0;
      categoryMap[type] = (categoryMap[type] || 0) + cost;
    });

    const totalCost = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;

    const typeLabels: Record<string, string> = {
      preventive: "Preventive Maintenance",
      corrective: "Repairs",
      inspection: "Inspections",
      emergency: "Emergency Repairs",
      recall: "Recalls",
      other: "Other",
    };

    return Object.entries(categoryMap)
      .map(([type, amount]) => ({
        name: typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1),
        type,
        amount,
        percentage: Math.round((amount / totalCost) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [getFilteredTasks]);

  // Calculate totals
  const totalMaintenanceCost = vehicleCostAnalysis.reduce((acc, v) => acc + v.totalCost, 0);
  const avgCostPerVehicle = vehicleCostAnalysis.length > 0
    ? totalMaintenanceCost / vehicleCostAnalysis.length
    : 0;
  const totalServices = vehicleCostAnalysis.reduce((acc, v) => acc + v.serviceCount, 0);

  // Sort vehicles
  const sortedVehicles = [...vehicleCostAnalysis].sort((a, b) => {
    if (sortBy === "totalCost") return b.totalCost - a.totalCost;
    if (sortBy === "costPerKm") return parseFloat(b.costPerKm) - parseFloat(a.costPerKm);
    return 0;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
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
          <h1 className="text-3xl font-bold tracking-tight">Cost Analysis</h1>
          <p className="text-muted-foreground">
            Analyze maintenance costs and identify trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalMaintenanceCost)}</p>
                <p className="text-sm text-muted-foreground">Total Maintenance Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(avgCostPerVehicle)}</p>
                <p className="text-sm text-muted-foreground">Avg Cost/Vehicle</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalServices}</p>
                <p className="text-sm text-muted-foreground">Total Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicleCostAnalysis.length}</p>
                <p className="text-sm text-muted-foreground">Vehicles with Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Trend</CardTitle>
            <CardDescription>Monthly maintenance expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Cost trend chart would go here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Category</CardTitle>
            <CardDescription>Breakdown of maintenance expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {costCategories.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">No cost data for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {costCategories.map((category) => (
                  <div key={category.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{category.name}</span>
                      <span className="font-medium">{formatCurrency(category.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Cost Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost by Vehicle</CardTitle>
              <CardDescription>Detailed breakdown per vehicle</CardDescription>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalCost">Total Cost</SelectItem>
                <SelectItem value="costPerKm">Cost per km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Labor Cost</TableHead>
                  <TableHead>Parts Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Cost/1000km</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No cost data for this period</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{vehicle.registrationPlate}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.make} {vehicle.model}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{vehicle.serviceCount}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(vehicle.laborCost)}</TableCell>
                      <TableCell>{formatCurrency(vehicle.partsCost)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(vehicle.totalCost)}
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(vehicle.costPerKm))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
