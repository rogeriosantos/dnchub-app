"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Fuel,
  DollarSign,
  Droplets,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fuelService, vehiclesService, driversService } from "@/lib/api";
import { formatDate, formatCurrency, formatFuelVolume, formatDistance, matchesSearch } from "@/lib/utils";
import type { FuelEntry, FuelType, Vehicle, Driver } from "@/types";

// Fuel type colors
const fuelTypeColors: Record<FuelType, string> = {
  petrol: "bg-amber-100 text-amber-800",
  gasoline: "bg-amber-100 text-amber-800",
  diesel: "bg-slate-100 text-slate-800",
  electric: "bg-green-100 text-green-800",
  hybrid: "bg-blue-100 text-blue-800",
  lpg: "bg-purple-100 text-purple-800",
  cng: "bg-cyan-100 text-cyan-800",
};

export default function FuelPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = React.useState<FuelEntry[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [entryToDelete, setEntryToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Load data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [entriesData, vehiclesData, driversData] = await Promise.all([
          fuelService.getAll({ limit: 500 }),
          vehiclesService.getAll({ limit: 500 }),
          driversService.getAll({ limit: 500 }),
        ]);

        setEntries(entriesData);
        setVehicles(vehiclesData);
        setDrivers(driversData);
      } catch (err) {
        console.error("Failed to load fuel data:", err);
        setError(t('fuel.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper functions
  const getVehicle = (vehicleId: string) => vehicles.find((v) => v.id === vehicleId);
  const getDriver = (driverId?: string) => driverId ? drivers.find((d) => d.id === driverId) : null;

  // Calculate stats (with defensive handling for null/undefined values)
  const totalVolume = entries.reduce((sum, entry) => sum + (Number(entry.volume) || 0), 0);
  const totalCost = entries.reduce((sum, entry) => sum + (Number(entry.totalCost) || 0), 0);
  const avgPricePerLiter = totalVolume > 0 ? totalCost / totalVolume : 0;
  const entriesThisMonth = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  });
  const costThisMonth = entriesThisMonth.reduce((sum, entry) => sum + (Number(entry.totalCost) || 0), 0);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const vehicle = getVehicle(entry.vehicleId);
    const driver = getDriver(entry.driverId);

    const matchesQuery = matchesSearch(
      [vehicle?.registrationPlate, driver?.firstName, driver?.lastName, entry.station],
      searchQuery
    );

    const matchesFuelType = fuelTypeFilter === "all" || entry.fuelType === fuelTypeFilter;

    // Date filtering
    let matchesDate = true;
    if (dateRange !== "all") {
      const entryDate = new Date(entry.date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateRange) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
        case "quarter":
          matchesDate = daysDiff <= 90;
          break;
      }
    }

    return matchesQuery && matchesFuelType && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, fuelTypeFilter, dateRange]);

  // Get unique fuel types from entries
  const fuelTypes = Array.from(new Set(entries.map((e) => e.fuelType)));

  // Handle delete
  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      setIsDeleting(true);
      await fuelService.delete(entryToDelete);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete));
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error("Failed to delete fuel entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">{t('errors.loadFailed')}</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('fuel.title')}</h1>
          <p className="text-muted-foreground">
            {t('fuel.subtitleAnalysis')}
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/fuel/log">
            <Plus className="mr-2 h-4 w-4" />
            {t('fuel.logFuelEntry')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.totalFuelCost')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.totalVolume')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatFuelVolume(totalVolume)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <Fuel className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.avgPricePerLiter')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(avgPricePerLiter)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fuel.stats.thisMonth')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(costThisMonth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('fuel.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('fuel.filter.fuelType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('fuel.filter.allTypes')}</SelectItem>
                  {fuelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`fuel.fuelTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('fuel.filter.dateRange')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('fuel.dateRange.allTime')}</SelectItem>
                  <SelectItem value="today">{t('fuel.dateRange.today')}</SelectItem>
                  <SelectItem value="week">{t('fuel.dateRange.last7Days')}</SelectItem>
                  <SelectItem value="month">{t('fuel.dateRange.last30Days')}</SelectItem>
                  <SelectItem value="quarter">{t('fuel.dateRange.last90Days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fuel.table.date')}</TableHead>
                  <TableHead>{t('fuel.table.vehicle')}</TableHead>
                  <TableHead>{t('fuel.table.driver')}</TableHead>
                  <TableHead>{t('fuel.table.fuelType')}</TableHead>
                  <TableHead>{t('fuel.table.station')}</TableHead>
                  <TableHead className="text-right">{t('fuel.table.volume')}</TableHead>
                  <TableHead className="text-right">{t('fuel.table.pricePerLiter')}</TableHead>
                  <TableHead className="text-right">{t('fuel.table.totalCost')}</TableHead>
                  <TableHead className="text-right">{t('fuel.table.odometer')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Fuel className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('fuel.noEntries')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEntries.map((entry) => {
                    const vehicle = getVehicle(entry.vehicleId);
                    const driver = getDriver(entry.driverId);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>
                          {vehicle ? (
                            <Link
                              href={`/fleet/vehicles/${vehicle.id}`}
                              className="font-medium hover:underline"
                            >
                              {vehicle.registrationPlate}
                            </Link>
                          ) : (
                            t('common.unknown')
                          )}
                        </TableCell>
                        <TableCell>
                          {driver ? (
                            <Link
                              href={`/fleet/employees/${driver.id}`}
                              className="hover:underline"
                            >
                              {driver.firstName} {driver.lastName}
                            </Link>
                          ) : (
                            t('common.notAvailable')
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={fuelTypeColors[entry.fuelType] || ""}
                          >
                            {t(`fuel.fuelTypes.${entry.fuelType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.station || t('common.notAvailable')}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatFuelVolume(entry.volume)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(entry.pricePerUnit)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(entry.totalCost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDistance(entry.odometer)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('common.openMenu')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/fuel/${entry.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('fuel.viewEntry')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/fuel/${entry.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('fuel.editEntry')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setEntryToDelete(entry.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete')}
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

          {/* Pagination */}
          {filteredEntries.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {t('common.showing')} {startIndex + 1}-{Math.min(endIndex, filteredEntries.length)} {t('common.of')} {filteredEntries.length} {t('common.entries')}
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>{t('common.perPage')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.previous')}
                </Button>
                <div className="flex items-center gap-1 text-sm">
                  <span>{t('common.page')}</span>
                  <span className="font-medium">{currentPage}</span>
                  <span>{t('common.of')}</span>
                  <span className="font-medium">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('fuel.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('fuel.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
