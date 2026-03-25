"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Pencil,
  Truck,
  TrendingUp,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { costCentersService } from "@/lib/api/cost-centers";
import { vehiclesService } from "@/lib/api/vehicles";
import { formatCurrency, cn } from "@/lib/utils";
import type { CostCenter, Vehicle } from "@/types";

export default function CostCenterDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [costCenter, setCostCenter] = React.useState<CostCenter | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [costCenterData, vehiclesData] = await Promise.all([
        costCentersService.getById(id),
        vehiclesService.getAll(),
      ]);
      setCostCenter(costCenterData);
      setVehicles(vehiclesData.filter((v) => v.costCenterId === id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cost center");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !costCenter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/cost-centers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {error ? "Error Loading Cost Center" : "Cost Center Not Found"}
            </h1>
            <p className="text-muted-foreground">
              {error || "The requested cost center does not exist"}
            </p>
          </div>
        </div>
        {error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive mb-2">Error</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const budget = costCenter.budget || 0;
  const spent = costCenter.currentSpend || 0;
  const usagePercent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const isOverBudget = usagePercent > 100;
  const remaining = budget - spent;

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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{costCenter.name}</h1>
              <Badge variant={costCenter.isActive ? "default" : "outline"}>
                {costCenter.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Code: {costCenter.code || "N/A"} | Period: {costCenter.budgetPeriod || "N/A"}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/fleet/cost-centers/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Cost Center
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(budget)}</p>
                <p className="text-sm text-muted-foreground">Budget ({costCenter.budgetPeriod || "yearly"})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(spent)}</p>
                <p className="text-sm text-muted-foreground">Current Spend</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-full p-2", remaining >= 0 ? "bg-green-100" : "bg-red-100")}>
                <Calendar className={cn("h-5 w-5", remaining >= 0 ? "text-green-600" : "text-red-600")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", remaining < 0 && "text-red-600")}>
                  {formatCurrency(Math.abs(remaining))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {remaining >= 0 ? "Remaining" : "Over Budget"}
                </p>
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
                <p className="text-2xl font-bold">{vehicles.length}</p>
                <p className="text-sm text-muted-foreground">Vehicles Allocated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Usage</CardTitle>
          <CardDescription>Budget consumption progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {formatCurrency(spent)} of {formatCurrency(budget)}
              </span>
              <span className={cn("text-sm font-medium", isOverBudget && "text-red-600")}>
                {usagePercent}%
              </span>
            </div>
            <Progress
              value={Math.min(usagePercent, 100)}
              className={cn("h-3", isOverBudget && "[&>div]:bg-red-500")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {costCenter.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{costCenter.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Allocated Vehicles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Allocated Vehicles</CardTitle>
              <CardDescription>Vehicles assigned to this cost center</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/fleet/cost-centers/allocations">
                Manage Allocations
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No vehicles allocated to this cost center
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/fleet/cost-centers/allocations">
                  Allocate Vehicles
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Link
                          href={`/fleet/vehicles/${vehicle.id}`}
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
                        <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
