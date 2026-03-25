"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Bell,
  AlertTriangle,
  Clock,
  Truck,
  MapPin,
  Gauge,
  BellOff,
  Settings,
} from "lucide-react";
import { vehiclesService } from "@/lib/api";
import type { Vehicle } from "@/types";

// Mock alert configurations
const mockAlertConfigs = [
  {
    id: "alert-001",
    name: "Speed Limit Alert",
    type: "speed",
    threshold: 80,
    unit: "km/h",
    isActive: true,
    vehicleCount: 6,
    triggeredCount: 12,
  },
  {
    id: "alert-002",
    name: "Geofence Entry - Warehouse",
    type: "geofence_entry",
    threshold: null,
    unit: null,
    isActive: true,
    vehicleCount: 3,
    triggeredCount: 45,
  },
  {
    id: "alert-003",
    name: "Idle Time Alert",
    type: "idle",
    threshold: 30,
    unit: "min",
    isActive: true,
    vehicleCount: 6,
    triggeredCount: 8,
  },
  {
    id: "alert-004",
    name: "After Hours Movement",
    type: "time",
    threshold: null,
    unit: "22:00-06:00",
    isActive: false,
    vehicleCount: 4,
    triggeredCount: 2,
  },
  {
    id: "alert-005",
    name: "Low Fuel Alert",
    type: "fuel",
    threshold: 15,
    unit: "%",
    isActive: true,
    vehicleCount: 6,
    triggeredCount: 5,
  },
];

// Mock recent alerts
const mockRecentAlerts = [
  {
    id: "ra-001",
    type: "speed",
    vehicle: "ABC-1234",
    message: "Speed exceeded: 85 km/h in 60 km/h zone",
    time: "10 min ago",
    severity: "warning",
  },
  {
    id: "ra-002",
    type: "geofence_exit",
    vehicle: "XYZ-5678",
    message: "Exited geofence: Warehouse A",
    time: "25 min ago",
    severity: "info",
  },
  {
    id: "ra-003",
    type: "idle",
    vehicle: "DEF-9012",
    message: "Vehicle idle for 45 minutes",
    time: "1 hour ago",
    severity: "warning",
  },
  {
    id: "ra-004",
    type: "geofence_entry",
    vehicle: "GHI-3456",
    message: "Entered geofence: Customer Zone",
    time: "2 hours ago",
    severity: "info",
  },
  {
    id: "ra-005",
    type: "fuel",
    vehicle: "JKL-7890",
    message: "Low fuel: 12% remaining",
    time: "3 hours ago",
    severity: "critical",
  },
];

const alertTypeIcons = {
  speed: Gauge,
  geofence_entry: MapPin,
  geofence_exit: MapPin,
  idle: Clock,
  time: Clock,
  fuel: AlertTriangle,
};

const severityColors = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function GPSAlertsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchVehicles() {
      try {
        const data = await vehiclesService.getAll();
        if (!cancelled) setVehicles(data);
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
      }
    }
    fetchVehicles();
    return () => { cancelled = true; };
  }, []);

  const filteredConfigs = mockAlertConfigs.filter((config) =>
    config.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GPS Alerts</h1>
          <p className="text-muted-foreground">
            Configure and monitor fleet alerts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
              <DialogDescription>
                Set up a new alert configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="alert-name">Alert Name</Label>
                <Input id="alert-name" placeholder="Enter alert name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-type">Alert Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speed">Speed Limit</SelectItem>
                    <SelectItem value="geofence">Geofence</SelectItem>
                    <SelectItem value="idle">Idle Time</SelectItem>
                    <SelectItem value="fuel">Fuel Level</SelectItem>
                    <SelectItem value="time">Time-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold</Label>
                  <Input id="threshold" type="number" placeholder="Value" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" placeholder="km/h, min, %" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Apply to Vehicles</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registrationPlate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAlertConfigs.length}</p>
                <p className="text-sm text-muted-foreground">Alert Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockAlertConfigs.filter((c) => c.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockAlertConfigs.reduce((acc, c) => acc + c.triggeredCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Triggers Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <BellOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockAlertConfigs.filter((c) => !c.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Disabled Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert Configurations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alert Rules</CardTitle>
                <CardDescription>Manage your alert configurations</CardDescription>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredConfigs.map((config) => {
                const Icon = alertTypeIcons[config.type as keyof typeof alertTypeIcons] || Bell;
                return (
                  <div
                    key={config.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{config.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.threshold && `${config.threshold} ${config.unit}`}
                          {!config.threshold && config.unit}
                          {" • "}{config.vehicleCount} vehicles
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{config.triggeredCount}</Badge>
                      <Switch checked={config.isActive} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest triggered alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecentAlerts.map((alert) => {
                const Icon = alertTypeIcons[alert.type as keyof typeof alertTypeIcons] || Bell;
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className={`rounded-full p-2 ${severityColors[alert.severity as keyof typeof severityColors]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-sm">{alert.vehicle}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
