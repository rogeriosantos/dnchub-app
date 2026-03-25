"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  History,
  Truck,
  Calendar,
  DollarSign,
  Download,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { maintenanceService, vehiclesService } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import type { MaintenanceTask, Vehicle } from "@/types";

const typeColors: Record<string, string> = {
  preventive: "bg-blue-100 text-blue-700",
  corrective: "bg-amber-100 text-amber-700",
  inspection: "bg-green-100 text-green-700",
  emergency: "bg-red-100 text-red-700",
  recall: "bg-purple-100 text-purple-700",
};

export default function MaintenanceHistoryPage() {
  const [tasks, setTasks] = React.useState<MaintenanceTask[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vehicleFilter, setVehicleFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await maintenanceService.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Load data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [tasksData, vehiclesData] = await Promise.all([
          maintenanceService.getAll({ status: "completed" as never, limit: 500 }),
          vehiclesService.getAll({ limit: 500 }),
        ]);

        // Filter for completed tasks
        const completedTasks = tasksData.filter((t) => t.status === "completed");
        setTasks(completedTasks);
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Failed to load history:", err);
        setError("Failed to load maintenance history. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredHistory = tasks.filter((record) => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVehicle = vehicleFilter === "all" || record.vehicleId === vehicleFilter;
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    return matchesSearch && matchesVehicle && matchesType;
  });

  const totalSpent = tasks.reduce((acc, r) => acc + (Number(r.actualCost) || 0), 0);
  const totalLabor = tasks.reduce((acc, r) => acc + (Number(r.laborCost) || 0), 0);
  const totalParts = tasks.reduce((acc, r) => acc + (Number(r.partsCost) || 0), 0);
  const avgCost = tasks.length > 0 ? totalSpent / tasks.length : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
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
          <h1 className="text-3xl font-bold tracking-tight">Service History</h1>
          <p className="text-muted-foreground">
            View completed maintenance records and service history
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export History
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
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
                <p className="text-2xl font-bold">{formatCurrency(avgCost)}</p>
                <p className="text-sm text-muted-foreground">Avg Cost/Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalLabor + totalParts)}</p>
                <p className="text-sm text-muted-foreground">Labor + Parts</p>
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
                placeholder="Search history..."
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="preventive">Preventive</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Labor</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No history records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((record) => {
                    const vehicle = vehicles.find((v) => v.id === record.vehicleId);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Link href={`/maintenance/${record.id}`} className="hover:underline">
                            <p className="font-medium">{record.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {record.notes || record.description || "No notes"}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Link
                              href={`/vehicles/${record.vehicleId}`}
                              className="hover:underline"
                            >
                              {vehicle?.registrationPlate || "N/A"}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("capitalize", typeColors[record.type] || "bg-gray-100 text-gray-700")}>
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {record.completedDate || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>{record.serviceProvider || "N/A"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{formatCurrency(Number(record.laborCost) || 0)}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(record.partsCost) || 0)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(record.actualCost) || 0)}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                disabled={deletingId === record.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{record.title}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(record.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
