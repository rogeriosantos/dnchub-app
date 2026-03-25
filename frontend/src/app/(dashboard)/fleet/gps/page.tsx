"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Map,
  Route,
  Bell,
  Truck,
  Navigation,
  Clock,
  Activity,
} from "lucide-react";
import { vehiclesService } from "@/lib/api";
import type { Vehicle } from "@/types";

const quickActions = [
  {
    title: "Live Map",
    description: "View real-time vehicle locations",
    icon: Map,
    href: "/fleet/gps/live",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Trip History",
    description: "Review past trips and routes",
    icon: Route,
    href: "/fleet/gps/trips",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Geofences",
    description: "Manage location boundaries",
    icon: MapPin,
    href: "/fleet/gps/geofences",
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Alerts",
    description: "Configure GPS alerts",
    icon: Bell,
    href: "/fleet/gps/alerts",
    color: "bg-red-100 text-red-600",
  },
];

export default function GPSPage() {
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

  const activeVehicles = vehicles.filter((v) => v.status === "active" || v.status === "in_transit");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GPS Tracking</h1>
          <p className="text-muted-foreground">
            Monitor vehicle locations and manage geofences
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/gps/live">
            <Map className="mr-2 h-4 w-4" />
            Open Live Map
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-2 ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Navigation className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeVehicles.length}</p>
                <p className="text-sm text-muted-foreground">Vehicles Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {vehicles.filter((v) => v.status === "in_transit").length}
                </p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Active Geofences</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Map Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Map Preview</CardTitle>
            <CardDescription>Current vehicle locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
              <div className="text-center">
                <Map className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Interactive map would be displayed here
                </p>
                <Button asChild className="mt-4">
                  <Link href="/fleet/gps/live">Open Full Map</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest GPS events and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { vehicle: "ABC-1234", event: "Entered geofence: Warehouse A", time: "2 min ago", type: "info" },
                { vehicle: "XYZ-5678", event: "Speed alert: 85 km/h in 60 zone", time: "15 min ago", type: "warning" },
                { vehicle: "DEF-9012", event: "Trip started", time: "32 min ago", type: "info" },
                { vehicle: "GHI-3456", event: "Exited geofence: City Center", time: "1 hour ago", type: "info" },
                { vehicle: "JKL-7890", event: "Idle alert: Stopped for 30 min", time: "1.5 hours ago", type: "warning" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${
                    activity.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.vehicle}</span>
                      {" - "}
                      {activity.event}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
