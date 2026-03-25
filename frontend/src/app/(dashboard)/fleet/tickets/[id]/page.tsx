"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Scale,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  CreditCard,
  User,
  Car,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketsService, vehiclesService, driversService } from "@/lib/api";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import type { Ticket, TicketStatus, TicketType, PaymentMethod, Vehicle, Driver } from "@/types";

// Status badge config
const ticketStatusConfig: Record<TicketStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { variant: "secondary", label: "Pending", icon: Clock },
  paid: { variant: "outline", label: "Paid", icon: CheckCircle },
  appealed: { variant: "default", label: "Appealed", icon: Scale },
  cancelled: { variant: "outline", label: "Cancelled", icon: XCircle },
  overdue: { variant: "destructive", label: "Overdue", icon: AlertTriangle },
};

// Ticket type labels
const ticketTypeLabels: Record<TicketType, string> = {
  speed: "Speed Violation",
  parking: "Parking Violation",
  toll: "Toll Violation",
  red_light: "Red Light Violation",
  other: "Other Violation",
};

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [driver, setDriver] = React.useState<Driver | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = React.useState({
    paidDate: new Date().toISOString().split("T")[0],
    paidAmount: "",
    paymentMethod: "credit_card" as PaymentMethod,
    paymentReference: "",
  });

  // Load ticket data
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const ticketData = await ticketsService.getById(ticketId);
        setTicket(ticketData);
        setPaymentForm(prev => ({
          ...prev,
          paidAmount: ticketData.amount.toString(),
        }));

        // Load vehicle
        if (ticketData.vehicleId) {
          try {
            const vehicleData = await vehiclesService.getById(ticketData.vehicleId);
            setVehicle(vehicleData);
          } catch (err) {
            console.error("Failed to load vehicle:", err);
          }
        }

        // Load driver
        if (ticketData.driverId) {
          try {
            const driverData = await driversService.getById(ticketData.driverId);
            setDriver(driverData);
          } catch (err) {
            console.error("Failed to load driver:", err);
          }
        }
      } catch (err) {
        console.error("Failed to load ticket:", err);
        setError("Failed to load ticket data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [ticketId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) {
      return;
    }
    try {
      setIsDeleting(true);
      await ticketsService.delete(ticketId);
      router.push("/fleet/tickets");
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      alert("Failed to delete ticket. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsPaying(true);
      const updated = await ticketsService.markAsPaid(ticketId, {
        paidDate: paymentForm.paidDate,
        paidAmount: parseFloat(paymentForm.paidAmount),
        paymentMethod: paymentForm.paymentMethod,
        paymentReference: paymentForm.paymentReference || undefined,
      });
      setTicket(updated);
      setIsPayDialogOpen(false);
    } catch (err) {
      console.error("Failed to process payment:", err);
      alert("Failed to process payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error Loading Ticket</h2>
        <p className="mt-2 text-muted-foreground">{error || "Ticket not found"}</p>
        <Button className="mt-4" asChild>
          <Link href="/fleet/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = ticketStatusConfig[ticket.status].icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {ticket.ticketNumber || `Ticket ${ticket.id.slice(0, 8)}`}
              </h1>
              <Badge variant={ticketStatusConfig[ticket.status].variant}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {ticketStatusConfig[ticket.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {ticketTypeLabels[ticket.type]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(ticket.status === "pending" || ticket.status === "overdue") && (
            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Ticket as Paid</DialogTitle>
                  <DialogDescription>
                    Enter the payment details for this ticket.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="paidDate">Payment Date</Label>
                    <Input
                      id="paidDate"
                      type="date"
                      value={paymentForm.paidDate}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paidDate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paidAmount">Amount Paid</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      value={paymentForm.paidAmount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={paymentForm.paymentMethod}
                      onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentReference">Reference (optional)</Label>
                    <Input
                      id="paymentReference"
                      placeholder="Transaction ID or receipt number"
                      value={paymentForm.paymentReference}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePayment} disabled={isPaying}>
                    {isPaying ? "Processing..." : "Confirm Payment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" asChild>
            <Link href={`/fleet/tickets/${ticketId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>Violation information and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ticket.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p>{ticket.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Violation Date</p>
                    <p className="font-medium">{formatDateTime(ticket.violationDate)}</p>
                  </div>
                </div>
                {ticket.violationLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{ticket.violationLocation}</p>
                    </div>
                  </div>
                )}
                {ticket.issuingAuthority && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Issuing Authority</p>
                      <p className="font-medium">{ticket.issuingAuthority}</p>
                    </div>
                  </div>
                )}
                {ticket.pointsDeducted !== undefined && ticket.pointsDeducted > 0 && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Points Deducted</p>
                      <p className="font-medium">{ticket.pointsDeducted} points</p>
                    </div>
                  </div>
                )}
              </div>

              {ticket.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                    <p className="text-sm">{ticket.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Vehicle & Driver */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle & Driver</CardTitle>
              <CardDescription>Associated vehicle and driver information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/fleet/vehicles/${vehicle.id}`}
                          className="font-medium hover:underline"
                        >
                          {vehicle.registrationPlate}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </p>
                      </div>
                      <Badge variant="outline">{vehicle.status}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {driver && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/fleet/employees/${driver.id}`}
                          className="font-medium hover:underline"
                        >
                          {driver.firstName} {driver.lastName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {driver.email}
                        </p>
                      </div>
                      <Badge variant="outline">{driver.status}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {!vehicle && !driver && (
                <p className="text-sm text-muted-foreground">No vehicle or driver associated</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Information (if paid) */}
          {ticket.status === "paid" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Details about the payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {ticket.paidDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Date</p>
                        <p className="font-medium">{formatDate(ticket.paidDate)}</p>
                      </div>
                    </div>
                  )}
                  {ticket.paidAmount !== undefined && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="font-medium">{formatCurrency(ticket.paidAmount)}</p>
                      </div>
                    </div>
                  )}
                  {ticket.paymentMethod && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium capitalize">{ticket.paymentMethod.replace("_", " ")}</p>
                      </div>
                    </div>
                  )}
                  {ticket.paymentReference && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Reference</p>
                        <p className="font-medium">{ticket.paymentReference}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                <div className="text-center">
                  <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-3xl font-bold tabular-nums">
                    {formatCurrency(ticket.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">Ticket Amount</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={ticketStatusConfig[ticket.status].variant} className="font-medium">
                    {ticketStatusConfig[ticket.status].label}
                  </Badge>
                </div>
                {ticket.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">{formatDate(ticket.dueDate)}</span>
                  </div>
                )}
                {ticket.paidAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-medium">{formatCurrency(ticket.paidAmount)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">Ticket Created</p>
                    <p className="text-muted-foreground">
                      {formatDateTime(ticket.createdAt)}
                    </p>
                  </div>
                </div>
                {ticket.updatedAt !== ticket.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-muted-foreground" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(ticket.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {ticket.paidDate && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-green-600" />
                    <div>
                      <p className="font-medium">Payment Received</p>
                      <p className="text-muted-foreground">
                        {formatDate(ticket.paidDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
