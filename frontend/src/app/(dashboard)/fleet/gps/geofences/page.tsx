"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Map,
  Circle,
  Square,
} from "lucide-react";

// Mock geofence data
const mockGeofences = [
  {
    id: "geo-001",
    name: "Warehouse A",
    type: "circle",
    address: "123 Industrial Park, City",
    radius: 500,
    isActive: true,
    alertOnEntry: true,
    alertOnExit: true,
    vehicleCount: 3,
    createdAt: "2024-01-15",
  },
  {
    id: "geo-002",
    name: "Office HQ",
    type: "polygon",
    address: "456 Business District, City",
    radius: null,
    isActive: true,
    alertOnEntry: true,
    alertOnExit: false,
    vehicleCount: 2,
    createdAt: "2024-02-10",
  },
  {
    id: "geo-003",
    name: "Customer Zone A",
    type: "circle",
    address: "789 Commercial Area, City",
    radius: 300,
    isActive: true,
    alertOnEntry: false,
    alertOnExit: true,
    vehicleCount: 0,
    createdAt: "2024-03-05",
  },
  {
    id: "geo-004",
    name: "Restricted Area",
    type: "polygon",
    address: "Downtown Core",
    radius: null,
    isActive: false,
    alertOnEntry: true,
    alertOnExit: true,
    vehicleCount: 0,
    createdAt: "2024-04-20",
  },
  {
    id: "geo-005",
    name: "Service Center",
    type: "circle",
    address: "321 Mechanic Lane, City",
    radius: 200,
    isActive: true,
    alertOnEntry: true,
    alertOnExit: true,
    vehicleCount: 1,
    createdAt: "2024-05-12",
  },
];

export default function GeofencesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const filteredGeofences = mockGeofences.filter((geofence) =>
    geofence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    geofence.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeGeofences = mockGeofences.filter((g) => g.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geofences</h1>
          <p className="text-muted-foreground">
            Create and manage location boundaries for your fleet
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Geofence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Geofence</DialogTitle>
              <DialogDescription>
                Define a new geographic boundary for tracking
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter geofence name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" placeholder="Circle or Polygon" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter location address" />
              </div>
              <div className="h-[200px] rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <Map className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Map for drawing geofence would be here
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="alert-entry" defaultChecked />
                  <Label htmlFor="alert-entry">Alert on entry</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="alert-exit" defaultChecked />
                  <Label htmlFor="alert-exit">Alert on exit</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Geofence
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockGeofences.length}</p>
                <p className="text-sm text-muted-foreground">Total Geofences</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeGeofences}</p>
                <p className="text-sm text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold">
                  {mockGeofences.reduce((acc, g) => acc + g.vehicleCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Vehicles in Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geofences Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search geofences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGeofences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No geofences found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGeofences.map((geofence) => (
                    <TableRow key={geofence.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{geofence.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {geofence.type === "circle" ? (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="capitalize">{geofence.type}</span>
                          {geofence.radius && (
                            <span className="text-muted-foreground">
                              ({geofence.radius}m)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {geofence.address}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {geofence.alertOnEntry && (
                            <Badge variant="outline" className="text-xs">Entry</Badge>
                          )}
                          {geofence.alertOnExit && (
                            <Badge variant="outline" className="text-xs">Exit</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{geofence.vehicleCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={geofence.isActive ? "default" : "outline"}>
                          {geofence.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Map className="mr-2 h-4 w-4" />
                              View on Map
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
