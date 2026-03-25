"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  DollarSign,
  Truck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { costCentersService } from "@/lib/api/cost-centers";
import { vehiclesService } from "@/lib/api/vehicles";
import { formatCurrency, cn, matchesSearch } from "@/lib/utils";
import type { CostCenter, Vehicle } from "@/types";

export default function CostCentersPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [costCenters, setCostCenters] = React.useState<CostCenter[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [costCentersData, vehiclesData] = await Promise.all([
        costCentersService.getAll(),
        vehiclesService.getAll(),
      ]);
      setCostCenters(costCentersData);
      setVehicles(vehiclesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("costCenters.errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await costCentersService.delete(deleteId);
      setCostCenters((prev) => prev.filter((cc) => cc.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("costCenters.errors.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Count vehicles per cost center
  const getVehicleCount = (costCenterId: string) => {
    return vehicles.filter((v) => v.costCenterId === costCenterId).length;
  };

  const filteredCostCenters = costCenters.filter((cc) =>
    matchesSearch([cc.name, cc.code], searchQuery)
  );

  const totalBudget = costCenters.reduce((acc, cc) => acc + (cc.budget || 0), 0);
  const totalSpent = costCenters.reduce((acc, cc) => acc + (cc.currentSpend || 0), 0);
  const totalVehicles = vehicles.filter((v) => v.costCenterId).length;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("costCenters.title")}</h1>
            <p className="text-muted-foreground">
              {t("costCenters.description")}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">{t("common.errorLoadingData")}</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("common.tryAgain")}
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("costCenters.title")}</h1>
          <p className="text-muted-foreground">
            {t("costCenters.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/cost-centers/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("costCenters.addCostCenter")}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{costCenters.length}</p>
                )}
                <p className="text-sm text-muted-foreground">{t("costCenters.stats.costCenters")}</p>
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
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                )}
                <p className="text-sm text-muted-foreground">{t("costCenters.stats.totalBudget")}</p>
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
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                )}
                <p className="text-sm text-muted-foreground">{t("costCenters.stats.totalSpent")}</p>
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
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalVehicles}</p>
                )}
                <p className="text-sm text-muted-foreground">{t("costCenters.stats.allocatedVehicles")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/fleet/cost-centers/budgets">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("costCenters.quickLinks.budgetManagement")}</h3>
                  <p className="text-sm text-muted-foreground">{t("costCenters.quickLinks.budgetManagementDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/fleet/cost-centers/allocations">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("costCenters.quickLinks.vehicleAllocations")}</h3>
                  <p className="text-sm text-muted-foreground">{t("costCenters.quickLinks.vehicleAllocationsDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Cost Centers Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("costCenters.searchPlaceholder")}
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
                  <TableHead>{t("costCenters.table.name")}</TableHead>
                  <TableHead>{t("costCenters.table.code")}</TableHead>
                  <TableHead>{t("costCenters.table.budget")}</TableHead>
                  <TableHead>{t("costCenters.table.spent")}</TableHead>
                  <TableHead>{t("costCenters.table.usage")}</TableHead>
                  <TableHead>{t("costCenters.table.vehicles")}</TableHead>
                  <TableHead>{t("costCenters.table.status")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCostCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t("costCenters.noCostCenters")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCostCenters.map((cc) => {
                    const budget = cc.budget || 0;
                    const spent = cc.currentSpend || 0;
                    const usagePercent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                    const isOverBudget = usagePercent > 100;
                    const vehicleCount = getVehicleCount(cc.id);

                    return (
                      <TableRow key={cc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{cc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {cc.code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(budget)}</TableCell>
                        <TableCell>{formatCurrency(spent)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 w-32">
                            <Progress
                              value={Math.min(usagePercent, 100)}
                              className={cn("h-2", isOverBudget && "[&>div]:bg-red-500")}
                            />
                            <span className={cn(
                              "text-sm tabular-nums",
                              isOverBudget && "text-red-600"
                            )}>
                              {usagePercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{vehicleCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cc.isActive ? "default" : "outline"}>
                            {cc.isActive ? t("common.active") : t("common.inactive")}
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
                              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/cost-centers/${cc.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("common.viewDetails")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/cost-centers/${cc.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t("common.edit")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(cc.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("costCenters.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("costCenters.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
