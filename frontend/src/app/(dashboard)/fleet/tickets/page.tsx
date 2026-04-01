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
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  CreditCard,
  Scale,
} from "lucide-react";
import { ticketsService, vehiclesService, driversService } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Ticket, TicketStatus, TicketType, TicketStats, Vehicle, Driver } from "@/types";

export default function TicketsPage() {
  const { t } = useTranslation();

  const ticketStatusConfig: Record<TicketStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    pending: { variant: "secondary", label: t("tickets.status.pending"), icon: Clock },
    paid: { variant: "outline", label: t("tickets.status.paid"), icon: CheckCircle },
    appealed: { variant: "default", label: t("tickets.status.appealed"), icon: Scale },
    cancelled: { variant: "outline", label: t("tickets.status.cancelled"), icon: XCircle },
    overdue: { variant: "destructive", label: t("tickets.status.overdue"), icon: AlertTriangle },
  };

  const ticketTypeLabels: Record<TicketType, string> = {
    speed: t("tickets.type.speed"),
    parking: t("tickets.type.parking"),
    toll: t("tickets.type.toll"),
    red_light: t("tickets.type.redLight"),
    other: t("tickets.type.other"),
  };

  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [stats, setStats] = React.useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [deleteDialogTicketId, setDeleteDialogTicketId] = React.useState<string | null>(null);

  // Handler to mark as paid
  const handleMarkAsPaid = async (ticketId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    try {
      setActionLoading(ticketId);
      const updated = await ticketsService.markAsPaid(ticketId, {
        paidDate: today,
        paidAmount: ticket.amount,
        paymentMethod: "other",
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      // Refresh stats
      const newStats = await ticketsService.getStats();
      setStats(newStats);
    } catch (err) {
      console.error("Failed to mark ticket as paid:", err);
      toast.error(t("tickets.errors.markAsPaidFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  // Handler to delete a ticket (called after dialog confirmation)
  const handleDeleteTicket = async (ticketId: string) => {
    try {
      setActionLoading(ticketId);
      await ticketsService.delete(ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      // Refresh stats
      const newStats = await ticketsService.getStats();
      setStats(newStats);
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      toast.error(t("tickets.errors.deleteFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  // Load data from API
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [ticketsData, vehiclesData, driversData, statsData] = await Promise.all([
          ticketsService.getAll({ limit: 500 }),
          vehiclesService.getAll({ limit: 500 }),
          driversService.getAll({ limit: 500 }),
          ticketsService.getStats(),
        ]);

        setTickets(ticketsData);
        setVehicles(vehiclesData);
        setDrivers(driversData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load tickets data:", err);
        setError(t("tickets.errors.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Build lookup maps
  const vehiclesMap = React.useMemo(() => {
    const map: Record<string, Vehicle> = {};
    vehicles.forEach((v) => { map[v.id] = v; });
    return map;
  }, [vehicles]);

  const driversMap = React.useMemo(() => {
    const map: Record<string, Driver> = {};
    drivers.forEach((d) => { map[d.id] = d; });
    return map;
  }, [drivers]);

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    return tickets.filter((ticket) => {
      const vehicle = vehiclesMap[ticket.vehicleId];
      const driver = ticket.driverId ? driversMap[ticket.driverId] : null;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearchResult =
        ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.violationLocation?.toLowerCase().includes(searchLower) ||
        vehicle?.registrationPlate.toLowerCase().includes(searchLower) ||
        (driver && `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesType = typeFilter === "all" || ticket.type === typeFilter;

      return matchesSearchResult && matchesStatus && matchesType;
    });
  }, [tickets, vehiclesMap, driversMap, searchQuery, statusFilter, typeFilter]);

  // Column definitions
  const columns = React.useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        id: "vehicle",
        header: t("tickets.table.vehicle"),
        defaultWidth: 190,
        sortValue: (row) => vehiclesMap[row.vehicleId]?.registrationPlate ?? "",
        cell: (row) => {
          const vehicle = vehiclesMap[row.vehicleId];
          return vehicle ? (
            <Link href={`/fleet/vehicles/${vehicle.id}`} className="hover:underline block">
              <p className="font-medium truncate">{vehicle.registrationPlate}</p>
              <p className="text-xs text-muted-foreground truncate">
                {vehicle.make} {vehicle.model}
              </p>
            </Link>
          ) : (
            <span className="text-muted-foreground">{t("common.unknown")}</span>
          );
        },
      },
      {
        id: "type",
        header: t("tickets.table.type"),
        accessorKey: "type",
        defaultWidth: 120,
        cell: (row) => (
          <Badge variant="outline">{ticketTypeLabels[row.type]}</Badge>
        ),
      },
      {
        id: "issueDate",
        header: t("tickets.table.violationDate"),
        accessorKey: "violationDate",
        defaultWidth: 130,
        cell: (row) => <span>{formatDate(row.violationDate)}</span>,
      },
      {
        id: "dueDate",
        header: t("tickets.table.dueDate"),
        accessorKey: "dueDate",
        defaultWidth: 130,
        cell: (row) => <span>{row.dueDate ? formatDate(row.dueDate) : "—"}</span>,
      },
      {
        id: "amount",
        header: t("tickets.table.amount"),
        defaultWidth: 100,
        sortValue: (row) => Number(row.amount),
        cell: (row) => (
          <span className="tabular-nums">{formatCurrency(row.amount)}</span>
        ),
      },
      {
        id: "status",
        header: t("tickets.table.status"),
        accessorKey: "status",
        defaultWidth: 120,
        cell: (row) => {
          const StatusIcon = ticketStatusConfig[row.status].icon;
          return (
            <Badge variant={ticketStatusConfig[row.status].variant}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {ticketStatusConfig[row.status].label}
            </Badge>
          );
        },
      },
      {
        id: "driver",
        header: t("tickets.table.driver"),
        defaultWidth: 150,
        sortValue: (row) => {
          const d = row.driverId ? driversMap[row.driverId] : null;
          return d ? `${d.firstName} ${d.lastName}` : "";
        },
        cell: (row) => {
          const driver = row.driverId ? driversMap[row.driverId] : null;
          return driver ? (
            <Link href={`/fleet/employees/${driver.id}`} className="hover:underline truncate block">
              {driver.firstName} {driver.lastName}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        defaultWidth: 60,
        enableSorting: false,
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/fleet/tickets/${row.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("common.viewDetails")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/fleet/tickets/${row.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("tickets.editTicket")}
                </Link>
              </DropdownMenuItem>
              {(row.status === "pending" || row.status === "overdue") && (
                <DropdownMenuItem
                  onClick={() => handleMarkAsPaid(row.id)}
                  disabled={actionLoading === row.id}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {actionLoading === row.id ? t("common.processing") : t("tickets.markAsPaid")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialogTicketId(row.id)}
                disabled={actionLoading === row.id}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {actionLoading === row.id ? t("common.deleting") : t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [vehiclesMap, driversMap, ticketStatusConfig, ticketTypeLabels, t, actionLoading, handleMarkAsPaid, setDeleteDialogTicketId]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
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
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">{t("common.errorLoadingData")}</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tickets.title")}</h1>
          <p className="text-muted-foreground">
            {t("tickets.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/fleet/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("tickets.addTicket")}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("tickets.stats.totalTickets")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("tickets.stats.pending")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.overdueCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("tickets.stats.overdue")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.paidCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("tickets.stats.paid")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats?.totalPending ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{t("tickets.stats.pendingAmount")}</p>
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
                  placeholder={t("tickets.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                  {Object.entries(ticketStatusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("common.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                  {Object.entries(ticketTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId="fleet-tickets"
            columns={columns}
            data={filteredTickets}
            isLoading={isLoading}
            defaultSortColumn="issueDate"
            defaultSortDir="desc"
            rowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogTicketId !== null} onOpenChange={(open) => { if (!open) setDeleteDialogTicketId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tickets.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tickets.deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDialogTicketId) {
                  handleDeleteTicket(deleteDialogTicketId);
                  setDeleteDialogTicketId(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
