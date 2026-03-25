"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Search,
  Truck,
  Building2,
  ArrowRight,
  Plus,
  X,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { vehiclesService } from "@/lib/api/vehicles";
import { costCentersService } from "@/lib/api/cost-centers";
import { cn } from "@/lib/utils";
import type { Vehicle, CostCenter } from "@/types";

export default function AllocationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [costCenterFilter, setCostCenterFilter] = React.useState("all");
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = React.useState(false);
  const [selectedVehicle, setSelectedVehicle] = React.useState("");
  const [selectedCostCenter, setSelectedCostCenter] = React.useState("");
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [costCenters, setCostCenters] = React.useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAllocating, setIsAllocating] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiclesData, costCentersData] = await Promise.all([
        vehiclesService.getAll(),
        costCentersService.getAll(),
      ]);
      setVehicles(vehiclesData);
      setCostCenters(costCentersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAllocate = async () => {
    if (!selectedVehicle || !selectedCostCenter) return;

    setIsAllocating(true);
    try {
      const updated = await vehiclesService.update(selectedVehicle, {
        costCenterId: selectedCostCenter,
      });
      setVehicles((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v))
      );
      setSelectedVehicle("");
      setSelectedCostCenter("");
      setIsAllocateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to allocate vehicle");
    } finally {
      setIsAllocating(false);
    }
  };

  const handleChangeAllocation = async (vehicleId: string, newCostCenterId: string | undefined) => {
    try {
      const updated = await vehiclesService.update(vehicleId, {
        costCenterId: newCostCenterId,
      });
      setVehicles((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update allocation");
    }
  };

  const allocatedVehicles = vehicles.filter((v) => v.costCenterId);
  const unallocatedVehicles = vehicles.filter((v) => !v.costCenterId);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registrationPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCostCenter =
      costCenterFilter === "all" ||
      (costCenterFilter === "unallocated" && !vehicle.costCenterId) ||
      vehicle.costCenterId === costCenterFilter;
    return matchesSearch && matchesCostCenter;
  });

  const getCostCenterName = (id: string | undefined) => {
    if (!id) return "Unallocated";
    const cc = costCenters.find((c) => c.id === id);
    return cc?.name || "Unknown";
  };

  if (error && vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/cost-centers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Allocations</h1>
            <p className="text-muted-foreground">
              Assign vehicles to cost centers for expense tracking
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">Error Loading Data</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/cost-centers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Allocations</h1>
            <p className="text-muted-foreground">
              Assign vehicles to cost centers for expense tracking
            </p>
          </div>
        </div>
        <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Allocate Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Allocate Vehicle</DialogTitle>
              <DialogDescription>
                Assign a vehicle to a cost center
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {unallocatedVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationPlate} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cost Center</Label>
                <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cost center" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.filter((cc) => cc.isActive).map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAllocateDialogOpen(false)}
                disabled={isAllocating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllocate}
                disabled={!selectedVehicle || !selectedCostCenter || isAllocating}
              >
                {isAllocating ? "Allocating..." : "Allocate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Banner */}
      {error && vehicles.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{allocatedVehicles.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Allocated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <X className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{unallocatedVehicles.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Unallocated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocations by Cost Center */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          costCenters.map((cc) => {
            const ccVehicles = vehicles.filter((v) => v.costCenterId === cc.id);
            return (
              <Card key={cc.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{cc.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{ccVehicles.length} vehicles</Badge>
                  </div>
                  {ccVehicles.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {ccVehicles.slice(0, 3).map((v) => (
                        <div key={v.id} className="flex items-center gap-2 text-sm">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <span>{v.registrationPlate}</span>
                        </div>
                      ))}
                      {ccVehicles.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{ccVehicles.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Allocations Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cost center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cost Centers</SelectItem>
                <SelectItem value="unallocated">Unallocated</SelectItem>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.name}
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cost Center</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No vehicles found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
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
                      <TableCell className="capitalize">{vehicle.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className={cn(!vehicle.costCenterId && "text-muted-foreground")}>
                            {getCostCenterName(vehicle.costCenterId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.costCenterId ? "default" : "secondary"}>
                          {vehicle.costCenterId ? "Allocated" : "Unallocated"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Change
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Assign to Cost Center</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {costCenters.filter((cc) => cc.isActive).map((cc) => (
                              <DropdownMenuItem
                                key={cc.id}
                                onClick={() => handleChangeAllocation(vehicle.id, cc.id)}
                                disabled={vehicle.costCenterId === cc.id}
                              >
                                <Building2 className="mr-2 h-4 w-4" />
                                {cc.name}
                                {vehicle.costCenterId === cc.id && " (Current)"}
                              </DropdownMenuItem>
                            ))}
                            {vehicle.costCenterId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleChangeAllocation(vehicle.id, undefined)}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Remove Allocation
                                </DropdownMenuItem>
                              </>
                            )}
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
