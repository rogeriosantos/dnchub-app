"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Route,
  Search,
  Truck,
  Clock,
  MapPin,
  Calendar,
  Download,
  Eye,
  Navigation,
} from "lucide-react";
import { vehiclesService, driversService } from "@/lib/api";
import { formatDistance, cn } from "@/lib/utils";
import type { Vehicle, Driver } from "@/types";

// Mock trip data
const mockTrips = [
  {
    id: "trip-001",
    vehicleId: "veh-001",
    driverId: "drv-001",
    startLocation: "Warehouse A, Industrial Park",
    endLocation: "Customer Site B, Downtown",
    startTime: "2024-12-11 08:30",
    endTime: "2024-12-11 10:15",
    distance: 45.2,
    duration: "1h 45m",
    status: "completed",
    avgSpeed: 38,
    maxSpeed: 72,
  },
  {
    id: "trip-002",
    vehicleId: "veh-002",
    driverId: "drv-002",
    startLocation: "Office HQ",
    endLocation: "Airport Terminal",
    startTime: "2024-12-11 09:00",
    endTime: "2024-12-11 09:45",
    distance: 28.5,
    duration: "45m",
    status: "completed",
    avgSpeed: 42,
    maxSpeed: 80,
  },
  {
    id: "trip-003",
    vehicleId: "veh-003",
    driverId: "drv-003",
    startLocation: "Distribution Center",
    endLocation: "Retail Store Chain",
    startTime: "2024-12-11 07:00",
    endTime: null,
    distance: 62.8,
    duration: "In progress",
    status: "in_progress",
    avgSpeed: 35,
    maxSpeed: 65,
  },
  {
    id: "trip-004",
    vehicleId: "veh-001",
    driverId: "drv-001",
    startLocation: "Customer Site B",
    endLocation: "Warehouse A",
    startTime: "2024-12-10 16:00",
    endTime: "2024-12-10 17:30",
    distance: 44.8,
    duration: "1h 30m",
    status: "completed",
    avgSpeed: 40,
    maxSpeed: 75,
  },
  {
    id: "trip-005",
    vehicleId: "veh-004",
    driverId: "drv-004",
    startLocation: "Service Center",
    endLocation: "Multiple Stops",
    startTime: "2024-12-10 09:00",
    endTime: "2024-12-10 15:00",
    distance: 120.5,
    duration: "6h",
    status: "completed",
    avgSpeed: 32,
    maxSpeed: 68,
  },
];

const tripStatusConfig = {
  completed: { label: "Completed", variant: "outline" as const },
  in_progress: { label: "In Progress", variant: "default" as const },
  cancelled: { label: "Cancelled", variant: "destructive" as const },
};

export default function TripHistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vehicleFilter, setVehicleFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("week");
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [vehiclesData, driversData] = await Promise.all([
          vehiclesService.getAll(),
          driversService.getAll(),
        ]);
        if (!cancelled) {
          setVehicles(vehiclesData);
          setDrivers(driversData);
        }
      } catch (err) {
        console.error("Failed to fetch vehicles/drivers:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredTrips = mockTrips.filter((trip) => {
    const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
    const matchesSearch =
      vehicle?.registrationPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.startLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.endLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVehicle = vehicleFilter === "all" || trip.vehicleId === vehicleFilter;
    return matchesSearch && matchesVehicle;
  });

  const totalDistance = mockTrips.reduce((acc, t) => acc + t.distance, 0);
  const completedTrips = mockTrips.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trip History</h1>
          <p className="text-muted-foreground">
            View and analyze past trips and routes
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Trips
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Route className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockTrips.length}</p>
                <p className="text-sm text-muted-foreground">Total Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Navigation className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDistance(totalDistance)}</p>
                <p className="text-sm text-muted-foreground">Total Distance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">38 km/h</p>
                <p className="text-sm text-muted-foreground">Avg Speed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTrips}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationPlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Avg Speed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Route className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No trips found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => {
                    const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
                    const driver = drivers.find((d) => d.id === trip.driverId);
                    return (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {vehicle?.registrationPlate || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {driver ? `${driver.firstName} ${driver.lastName}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm truncate">{trip.startLocation}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              → {trip.endLocation}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{trip.startTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>{trip.duration}</TableCell>
                        <TableCell>{formatDistance(trip.distance)}</TableCell>
                        <TableCell>{trip.avgSpeed} km/h</TableCell>
                        <TableCell>
                          <Badge variant={tripStatusConfig[trip.status as keyof typeof tripStatusConfig].variant}>
                            {tripStatusConfig[trip.status as keyof typeof tripStatusConfig].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
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
