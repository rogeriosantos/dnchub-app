"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Fuel,
  Clock,
  Route,
  Shield,
  Star,
  Calendar,
} from "lucide-react";
import { driversService } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Driver } from "@/types";

interface DriverPerformanceRow extends Driver {
  tripsCompleted: number;
  totalPerformanceDistance: number;
  fuelEfficiency: string;
  onTimeDelivery: number;
  incidents: number;
  avgTripTime: string;
  rating: string;
}

function buildPerformanceData(drivers: Driver[]): DriverPerformanceRow[] {
  // Seed-based pseudo-random to keep values stable across re-renders
  return drivers.map((driver, i) => ({
    ...driver,
    tripsCompleted: ((i * 17 + 7) % 50) + 20,
    totalPerformanceDistance: ((i * 1237 + 431) % 5000) + 1000,
    fuelEfficiency: (((i * 13 + 3) % 30) / 10 + 8).toFixed(1),
    onTimeDelivery: ((i * 11 + 5) % 15) + 85,
    incidents: (i * 7 + 2) % 3,
    avgTripTime: (((i * 19 + 1) % 20) / 10 + 1).toFixed(1),
    rating: (((i * 23 + 9) % 15) / 10 + 3.5).toFixed(1),
  }));
}

const getSafetyScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-amber-600";
  return "text-red-600";
};

export default function DriverPerformancePage() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = React.useState("month");
  const [sortBy, setSortBy] = React.useState("safetyScore");
  const [driverPerformanceData, setDriverPerformanceData] = React.useState<DriverPerformanceRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchDrivers() {
      try {
        const drivers = await driversService.getAll();
        if (!cancelled) {
          setDriverPerformanceData(buildPerformanceData(drivers));
        }
      } catch (err) {
        console.error("Failed to fetch drivers:", err);
        if (!cancelled) {
          setDriverPerformanceData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDrivers();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  const sortedDrivers = [...driverPerformanceData].sort((a, b) => {
    if (sortBy === "safetyScore") return (b.safetyScore || 0) - (a.safetyScore || 0);
    if (sortBy === "trips") return b.tripsCompleted - a.tripsCompleted;
    if (sortBy === "efficiency") return parseFloat(b.fuelEfficiency) - parseFloat(a.fuelEfficiency);
    return 0;
  });

  const topPerformer = sortedDrivers[0];
  const avgSafetyScore = driverPerformanceData.length > 0
    ? Math.round(
        driverPerformanceData.reduce((acc, d) => acc + (d.safetyScore || 0), 0) / driverPerformanceData.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('drivers.performance.title')}</h1>
          <p className="text-muted-foreground">
            {t('drivers.performance.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('drivers.performance.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('drivers.performance.thisWeek')}</SelectItem>
              <SelectItem value="month">{t('drivers.performance.thisMonth')}</SelectItem>
              <SelectItem value="quarter">{t('drivers.performance.thisQuarter')}</SelectItem>
              <SelectItem value="year">{t('drivers.performance.thisYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {t('drivers.performance.exportReport')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgSafetyScore}%</p>
                <p className="text-sm text-muted-foreground">{t('drivers.performance.avgSafetyScore')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Route className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {driverPerformanceData.reduce((acc, d) => acc + d.tripsCompleted, 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('drivers.performance.totalTrips')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Fuel className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">9.2 km/L</p>
                <p className="text-sm text-muted-foreground">{t('drivers.performance.avgEfficiency')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {driverPerformanceData.reduce((acc, d) => acc + d.incidents, 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('drivers.performance.totalIncidents')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performer Card */}
      {topPerformer && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{t('drivers.performance.topPerformer')}</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Star className="mr-1 h-3 w-3" />
                    {t('drivers.performance.bestThisMonth')}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">
                  {topPerformer.firstName} {topPerformer.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('drivers.safetyScore')}: {topPerformer.safetyScore}% | {topPerformer.tripsCompleted} {t('drivers.performance.tripsCompleted')}
                </p>
              </div>
              <Button asChild>
                <Link href={`/drivers/${topPerformer.id}`}>{t('drivers.performance.viewProfile')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('drivers.performance.performanceRankings')}</CardTitle>
              <CardDescription>{t('drivers.performance.detailedMetrics')}</CardDescription>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('drivers.performance.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safetyScore">{t('drivers.safetyScore')}</SelectItem>
                <SelectItem value="trips">{t('drivers.performance.tripsCompleted')}</SelectItem>
                <SelectItem value="efficiency">{t('drivers.performance.fuelEfficiency')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('drivers.performance.rank')}</TableHead>
                  <TableHead>{t('drivers.table.driver')}</TableHead>
                  <TableHead>{t('drivers.safetyScore')}</TableHead>
                  <TableHead>{t('drivers.performance.trips')}</TableHead>
                  <TableHead>{t('drivers.performance.distance')}</TableHead>
                  <TableHead>{t('drivers.performance.fuelEfficiency')}</TableHead>
                  <TableHead>{t('drivers.performance.onTime')}</TableHead>
                  <TableHead>{t('drivers.performance.incidents')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDrivers.map((driver, index) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                        {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                        {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                        <span className="font-medium">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/drivers/${driver.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {driver.firstName[0]}{driver.lastName[0]}
                        </div>
                        <span className="font-medium">
                          {driver.firstName} {driver.lastName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={driver.safetyScore} className="w-16 h-2" />
                        <span className={cn("font-medium", getSafetyScoreColor(driver.safetyScore || 0))}>
                          {driver.safetyScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{driver.tripsCompleted}</TableCell>
                    <TableCell>{driver.totalPerformanceDistance.toLocaleString()} km</TableCell>
                    <TableCell>{driver.fuelEfficiency} km/L</TableCell>
                    <TableCell>
                      <Badge variant={driver.onTimeDelivery >= 90 ? "default" : "secondary"}>
                        {driver.onTimeDelivery}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {driver.incidents > 0 ? (
                        <Badge variant="destructive">{driver.incidents}</Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
