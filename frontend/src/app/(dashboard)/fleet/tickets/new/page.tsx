"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Receipt, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ticketsService, vehiclesService, driversService } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { TicketType, Vehicle, Driver } from "@/types";

export default function NewTicketPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    ticketNumber: "",
    type: "" as TicketType | "",
    vehicleId: "",
    driverId: "",
    violationDate: "",
    violationLocation: "",
    issuingAuthority: "",
    amount: "",
    dueDate: "",
    pointsDeducted: "",
    description: "",
    notes: "",
  });

  const ticketTypes: { value: TicketType; label: string; description: string }[] = [
    { value: "speed", label: t("tickets.type.speed"), description: t("tickets.type.speedDesc") },
    { value: "parking", label: t("tickets.type.parking"), description: t("tickets.type.parkingDesc") },
    { value: "toll", label: t("tickets.type.toll"), description: t("tickets.type.tollDesc") },
    { value: "red_light", label: t("tickets.type.redLight"), description: t("tickets.type.redLightDesc") },
    { value: "other", label: t("tickets.type.other"), description: t("tickets.type.otherDesc") },
  ];

  // Computed values
  const selectedVehicleData = vehicles.find((v) => v.id === formData.vehicleId);
  const selectedDriverData = drivers.find((d) => d.id === formData.driverId);

  // Load vehicles and drivers
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiclesData, driversData] = await Promise.all([
          vehiclesService.getAll({ limit: 500 }),
          driversService.getAll({ limit: 500 }),
        ]);
        setVehicles(vehiclesData);
        setDrivers(driversData);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const ticketData = {
        ticketNumber: formData.ticketNumber || undefined,
        type: formData.type as TicketType,
        vehicleId: formData.vehicleId,
        driverId: formData.driverId || undefined,
        violationDate: new Date(formData.violationDate).toISOString(),
        violationLocation: formData.violationLocation || undefined,
        issuingAuthority: formData.issuingAuthority || undefined,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate || undefined,
        pointsDeducted: formData.pointsDeducted ? parseInt(formData.pointsDeducted) : undefined,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
      };

      await ticketsService.create(ticketData);
      router.push("/fleet/tickets");
    } catch (err: unknown) {
      console.error("Failed to create ticket:", err);
      const errorMessage = err instanceof Error ? err.message : t("tickets.errors.createFailed");
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fleet/tickets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tickets.addTicket")}</h1>
          <p className="text-muted-foreground">{t("tickets.new.description")}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tickets.new.ticketInfo")}</CardTitle>
                <CardDescription>{t("tickets.new.ticketInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ticketNumber">{t("tickets.fields.ticketNumber")}</Label>
                    <Input
                      id="ticketNumber"
                      placeholder="e.g., TKT-2024-001"
                      value={formData.ticketNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">{t("tickets.fields.type")}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t("tickets.fields.selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div>{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("tickets.fields.description")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("tickets.fields.descriptionPlaceholder")}
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle & Driver */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tickets.new.vehicleDriver")}</CardTitle>
                <CardDescription>{t("tickets.new.vehicleDriverDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">{t("tickets.fields.vehicle")}</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => handleSelectChange("vehicleId", value)}
                    >
                      <SelectTrigger id="vehicleId">
                        <SelectValue placeholder={t("tickets.fields.selectVehicle")} />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {t("common.noVehiclesAvailable")}
                          </SelectItem>
                        ) : (
                          vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.registrationPlate} - {vehicle.make} {vehicle.model}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverId">{t("tickets.fields.driver")}</Label>
                    <Select
                      value={formData.driverId || "none"}
                      onValueChange={(value) => handleSelectChange("driverId", value === "none" ? "" : value)}
                    >
                      <SelectTrigger id="driverId">
                        <SelectValue placeholder={t("tickets.fields.selectDriver")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("common.none")}</SelectItem>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedVehicleData && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium">{t("tickets.new.vehicleDetails")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("vehicles.fields.makeModel")}:</span>{" "}
                        {selectedVehicleData.make} {selectedVehicleData.model}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("vehicles.fields.year")}:</span>{" "}
                        {selectedVehicleData.year}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Violation Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tickets.new.violationDetails")}</CardTitle>
                <CardDescription>{t("tickets.new.violationDetailsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="violationDate">{t("tickets.fields.violationDate")}</Label>
                    <Input
                      id="violationDate"
                      type="datetime-local"
                      required
                      value={formData.violationDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="violationLocation">{t("tickets.fields.location")}</Label>
                    <Input
                      id="violationLocation"
                      placeholder={t("tickets.fields.locationPlaceholder")}
                      value={formData.violationLocation}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuingAuthority">{t("tickets.fields.issuingAuthority")}</Label>
                  <Input
                    id="issuingAuthority"
                    placeholder={t("tickets.fields.issuingAuthorityPlaceholder")}
                    value={formData.issuingAuthority}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t("tickets.new.financialDetails")}</CardTitle>
                <CardDescription>{t("tickets.new.financialDetailsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t("tickets.fields.amount")}</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">{t("tickets.fields.dueDate")}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsDeducted">{t("tickets.fields.pointsDeducted")}</Label>
                    <Input
                      id="pointsDeducted"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.pointsDeducted}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t("common.additionalNotes")}</CardTitle>
                <CardDescription>{t("common.additionalNotesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  placeholder={t("common.additionalNotesPlaceholder")}
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t("common.summary")}</CardTitle>
                <CardDescription>{t("tickets.new.ticketOverview")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                  <div className="text-center">
                    <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-3xl font-bold tabular-nums">
                      {formatCurrency(formData.amount ? parseFloat(formData.amount) : 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("tickets.new.ticketAmount")}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("common.type")}</span>
                    <span className="font-medium capitalize">
                      {formData.type ? ticketTypes.find(tt => tt.value === formData.type)?.label : t("common.notSelected")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("tickets.fields.vehicle")}</span>
                    <span className="font-medium">
                      {selectedVehicleData?.registrationPlate || t("common.notSelected")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("tickets.fields.driver")}</span>
                    <span className="font-medium">
                      {selectedDriverData ? `${selectedDriverData.firstName} ${selectedDriverData.lastName}` : t("common.notSelected")}
                    </span>
                  </div>
                  {formData.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("tickets.fields.dueDate")}</span>
                      <span className="font-medium">{formData.dueDate}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? t("common.saving") : t("tickets.createTicket")}
                  </Button>
                  <Button variant="outline" type="button" asChild>
                    <Link href="/fleet/tickets">{t("common.cancel")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
