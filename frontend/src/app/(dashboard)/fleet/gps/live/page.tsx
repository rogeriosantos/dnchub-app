"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Map,
  Search,
  Truck,
  Navigation,
  MapPin,
  RefreshCw,
  Maximize2,
  Layers,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { vehiclesService } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types";

const statusColors: Record<VehicleStatus, string> = {
  active: "bg-green-500",
  in_transit: "bg-blue-500",
  maintenance: "bg-amber-500",
  idle: "bg-gray-400",
  out_of_service: "bg-red-500",
};

export default function LiveMapPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedVehicle, setSelectedVehicle] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchVehicles() {
      try {
        const data = await vehiclesService.getAll();
        if (!cancelled) setVehicles(data);
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVehicles();
    return () => { cancelled = true; };
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registrationPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vehicles</CardTitle>
            <Button variant="ghost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                    selectedVehicle === vehicle.id && "border-primary bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1 h-3 w-3 rounded-full", statusColors[vehicle.status])} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{vehicle.registrationPlate}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Navigation className="h-3 w-3" />
                        <span>Last update: 2 min ago</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Map Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Live Map</CardTitle>
            <CardDescription>Real-time vehicle tracking</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Layers className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <div className="relative h-full rounded-lg border bg-muted/30">
            {/* Map Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Interactive Map</p>
                <p className="text-sm text-muted-foreground">
                  Google Maps or Mapbox integration would display here
                </p>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <Button variant="secondary" size="icon">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-background/95 p-3 shadow-lg">
              <p className="text-xs font-medium mb-2">Status Legend</p>
              <div className="space-y-1">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2 text-xs">
                    <div className={cn("h-2 w-2 rounded-full", color)} />
                    <span className="capitalize">{status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Vehicle Info */}
            {selectedVehicle && (
              <div className="absolute bottom-4 right-4 w-64 rounded-lg bg-background/95 p-4 shadow-lg">
                {(() => {
                  const vehicle = vehicles.find((v) => v.id === selectedVehicle);
                  if (!vehicle) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">{vehicle.registrationPlate}</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{vehicle.make} {vehicle.model}</p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          123 Main Street, City
                        </p>
                        <p>Speed: 45 km/h</p>
                        <p>Heading: North</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
