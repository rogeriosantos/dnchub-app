"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Truck,
  Fuel,
  DollarSign,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { dashboardService } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

// Report card data
const reportTypes = [
  {
    id: "fleet-summary",
    title: "Fleet Summary Report",
    description: "Overview of all vehicles, their status, and utilization",
    icon: Truck,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "fuel-analysis",
    title: "Fuel Analysis Report",
    description: "Detailed breakdown of fuel consumption and costs",
    icon: Fuel,
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "maintenance-history",
    title: "Maintenance History",
    description: "Complete maintenance records and upcoming tasks",
    icon: Wrench,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "driver-performance",
    title: "Driver Performance Report",
    description: "Safety scores, trip history, and driver analytics",
    icon: Users,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "cost-analysis",
    title: "Cost Analysis Report",
    description: "Total cost of ownership and expense breakdown",
    icon: DollarSign,
    color: "bg-red-100 text-red-600",
  },
  {
    id: "compliance",
    title: "Compliance Report",
    description: "License, registration, and insurance expiry status",
    icon: FileText,
    color: "bg-cyan-100 text-cyan-600",
  },
];

const defaultMetrics: Partial<DashboardMetrics> = {
  totalVehicles: 0,
  activeVehicles: 0,
  fuelCostThisMonth: 0,
  maintenanceDueCount: 0,
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = React.useState("last30");
  const [metrics, setMetrics] = React.useState<Partial<DashboardMetrics>>(defaultMetrics);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchMetrics() {
      try {
        const stats = await dashboardService.getStats();
        if (!cancelled) {
          setMetrics(stats);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMetrics();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download fleet management reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="last90">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fleet Size</p>
                <p className="text-2xl font-bold">{metrics.totalVehicles}</p>
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
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">
                  {metrics.totalVehicles ? Math.round(((metrics.activeVehicles ?? 0) / metrics.totalVehicles) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <Fuel className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fuel Cost (MTD)</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(metrics.fuelCostThisMonth ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                <Wrench className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Due</p>
                <p className="text-2xl font-bold">{metrics.maintenanceDueCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${report.color}`}>
                    <report.icon className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Fleet Summary Report</p>
                  <p className="text-sm text-muted-foreground">
                    Generated Dec 1, 2024 • PDF • 2.4 MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Fuel Analysis - November 2024</p>
                  <p className="text-sm text-muted-foreground">
                    Generated Nov 30, 2024 • Excel • 1.8 MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Maintenance History Q3 2024</p>
                  <p className="text-sm text-muted-foreground">
                    Generated Oct 1, 2024 • PDF • 3.1 MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Automatically generated reports</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Add Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Weekly Fleet Summary</p>
                  <p className="text-sm text-muted-foreground">
                    Every Monday at 8:00 AM • Email to team@company.com
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Monthly Cost Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    1st of every month at 9:00 AM • Email to finance@company.com
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
