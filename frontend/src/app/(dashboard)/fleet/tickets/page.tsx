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

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const vehicle = vehicles.find((v) => v.id === ticket.vehicleId);
    const driver = drivers.find((d) => d.id === ticket.driverId);

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
      ticket.description?.toLowerCase().includes(searchLower) ||
      ticket.violationLocation?.toLowerCase().includes(searchLower) ||
      vehicle?.registrationPlate.toLowerCase().includes(searchLower) ||
      (driver && `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesType = typeFilter === "all" || ticket.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tickets.table.ticketNumber")}</TableHead>
                  <TableHead>{t("tickets.table.type")}</TableHead>
                  <TableHead>{t("tickets.table.vehicle")}</TableHead>
                  <TableHead>{t("tickets.table.driver")}</TableHead>
                  <TableHead>{t("tickets.table.violationDate")}</TableHead>
                  <TableHead>{t("tickets.table.dueDate")}</TableHead>
                  <TableHead>{t("tickets.table.status")}</TableHead>
                  <TableHead className="text-right">{t("tickets.table.amount")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t("tickets.noTickets")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => {
                    const vehicle = vehicles.find((v) => v.id === ticket.vehicleId);
                    const driver = drivers.find((d) => d.id === ticket.driverId);
                    const StatusIcon = ticketStatusConfig[ticket.status].icon;
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <Link
                            href={`/fleet/tickets/${ticket.id}`}
                            className="font-medium hover:underline"
                          >
                            {ticket.ticketNumber || ticket.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ticketTypeLabels[ticket.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {vehicle ? (
                            <Link
                              href={`/fleet/vehicles/${vehicle.id}`}
                              className="hover:underline"
                            >
                              {vehicle.registrationPlate}
                            </Link>
                          ) : (
                            t("common.unknown")
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
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(ticket.violationDate)}</TableCell>
                        <TableCell>
                          {ticket.dueDate ? formatDate(ticket.dueDate) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticketStatusConfig[ticket.status].variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {ticketStatusConfig[ticket.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(ticket.amount)}
                        </TableCell>
                        <TableCell>
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
                                <Link href={`/fleet/tickets/${ticket.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("common.viewDetails")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/tickets/${ticket.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t("tickets.editTicket")}
                                </Link>
                              </DropdownMenuItem>
                              {(ticket.status === "pending" || ticket.status === "overdue") && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsPaid(ticket.id)}
                                  disabled={actionLoading === ticket.id}
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  {actionLoading === ticket.id ? t("common.processing") : t("tickets.markAsPaid")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialogTicketId(ticket.id)}
                                disabled={actionLoading === ticket.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {actionLoading === ticket.id ? t("common.deleting") : t("common.delete")}
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
