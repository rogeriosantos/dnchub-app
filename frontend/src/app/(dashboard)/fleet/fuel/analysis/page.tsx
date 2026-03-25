"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Fuel,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  BarChart3,
  Download,
  AlertCircle,
} from "lucide-react";
import { fuelService, vehiclesService } from "@/lib/api";
import { formatCurrency, formatFuelVolume, cn } from "@/lib/utils";
import type { FuelEntry, Vehicle, FuelAnalytics } from "@/types";

interface VehicleFuelAnalysis {
  vehicle: Vehicle;
  totalFuel: number;
  totalCost: number;
  fillUps: number;
  avgEfficiency: number | null;
}

export default function FuelAnalysisPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = React.useState<FuelEntry[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [analytics, setAnalytics] = React.useState<FuelAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState("month");
  const [vehicleFilter, setVehicleFilter] = React.useState("all");

  // Calculate date range based on selected time range
  const getDateRange = React.useCallback(() => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(start.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [timeRange]);

  // Load data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const { startDate, endDate } = getDateRange();

        const [entriesData, vehiclesData, analyticsData] = await Promise.all([
          fuelService.getAll({ startDate, endDate, limit: 1000 }),
          vehiclesService.getAll({ limit: 500 }),
          fuelService.getAnalytics(startDate, endDate).catch(() => null),
        ]);

        setEntries(entriesData);
        setVehicles(vehiclesData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Failed to load analysis data:", err);
        setError(t('fuel.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [getDateRange]);

  // Calculate vehicle analysis
  const vehicleFuelAnalysis: VehicleFuelAnalysis[] = React.useMemo(() => {
    return vehicles.map((vehicle) => {
      const vehicleEntries = entries.filter((e) => e.vehicleId === vehicle.id);
      const totalFuel = vehicleEntries.reduce((acc, e) => acc + (Number(e.volume) || 0), 0);
      const totalCost = vehicleEntries.reduce((acc, e) => acc + (Number(e.totalCost) || 0), 0);
      const efficiencyEntries = vehicleEntries.filter((e) => e.fuelEfficiency != null);
      const avgEfficiency = efficiencyEntries.length > 0
        ? efficiencyEntries.reduce((acc, e) => acc + (Number(e.fuelEfficiency) || 0), 0) / efficiencyEntries.length
        : null;

      return {
        vehicle,
        totalFuel,
        totalCost,
        fillUps: vehicleEntries.length,
        avgEfficiency,
      };
    }).filter((v) => v.fillUps > 0);
  }, [entries, vehicles]);

  // Calculate totals
  const totalFuelCost = entries.reduce((acc, e) => acc + (Number(e.totalCost) || 0), 0);
  const totalFuelVolume = entries.reduce((acc, e) => acc + (Number(e.volume) || 0), 0);
  const avgCostPerLiter = totalFuelVolume > 0 ? totalFuelCost / totalFuelVolume : 0;
  const efficiencyEntries = entries.filter((e) => e.fuelEfficiency != null);
  const fleetAvgEfficiency = efficiencyEntries.length > 0
    ? efficiencyEntries.reduce((acc, e) => acc + (Number(e.fuelEfficiency) || 0), 0) / efficiencyEntries.length
    : null;

  const filteredAnalysis = vehicleFilter === "all"
    ? vehicleFuelAnalysis
    : vehicleFuelAnalysis.filter((v) => v.vehicle.id === vehicleFilter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
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
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('fuel.analysis.title')}</h1>
          <p className="text-muted-foreground">
            {t('fuel.analysis.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('fuel.analysis.timeRangePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('fuel.dateRange.thisWeek')}</SelectItem>
              <SelectItem value="month">{t('fuel.dateRange.thisMonth')}</SelectItem>
              <SelectItem value="quarter">{t('fuel.dateRange.thisQuarter')}</SelectItem>
              <SelectItem value="year">{t('fuel.dateRange.thisYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('fuel.analysis.export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalFuelCost)}</p>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.totalFuelCost')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                <Fuel className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatFuelVolume(totalFuelVolume)}</p>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.totalVolume')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/20">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(avgCostPerLiter)}/L</p>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.avgCostPerLiter')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {fleetAvgEfficiency ? `${fleetAvgEfficiency.toFixed(1)} km/L` : t('common.notAvailable')}
                </p>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.fleetAvgEfficiency')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>{t('fuel.analysis.periodSummary')}</CardTitle>
            <CardDescription>
              {t('fuel.analysis.periodSummaryDescription', {
                count: analytics.entriesCount,
                startDate: new Date(getDateRange().startDate).toLocaleDateString(),
                endDate: new Date(getDateRange().endDate).toLocaleDateString()
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold tabular-nums">{formatCurrency(analytics.totalCost)}</p>
                <p className="text-sm text-muted-foreground">{t('fuel.totalCost')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold tabular-nums">{formatFuelVolume(analytics.totalVolume)}</p>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.totalVolume')}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold tabular-nums">{analytics.entriesCount}</p>
                <p className="text-sm text-muted-foreground">{t('fuel.analysis.fillUps')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Analysis Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('fuel.analysis.vehicleFuelAnalysis')}</CardTitle>
              <CardDescription>{t('fuel.analysis.vehicleAnalysisDescription')}</CardDescription>
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('fuel.filter.byVehicle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('fuel.filter.allVehicles')}</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationPlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fuel.vehicle')}</TableHead>
                  <TableHead className="text-right">{t('fuel.analysis.totalFuel')}</TableHead>
                  <TableHead className="text-right">{t('fuel.totalCost')}</TableHead>
                  <TableHead className="text-right">{t('fuel.analysis.fillUps')}</TableHead>
                  <TableHead className="text-right">{t('fuel.analysis.avgEfficiency')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalysis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Fuel className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('fuel.analysis.noFuelData')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnalysis.map((analysis) => (
                    <TableRow key={analysis.vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{analysis.vehicle.registrationPlate}</p>
                            <p className="text-sm text-muted-foreground">
                              {analysis.vehicle.make} {analysis.vehicle.model}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatFuelVolume(analysis.totalFuel)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(analysis.totalCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {analysis.fillUps}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {analysis.avgEfficiency ? `${analysis.avgEfficiency.toFixed(1)} km/L` : t('common.notAvailable')}
                      </TableCell>
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
