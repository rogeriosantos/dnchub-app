"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Fuel,
  Truck,
  User,
  Calendar,
  Clock,
  Gauge,
  Droplets,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  LogOut,
  TrendingUp,
  AlertCircle,
  Loader2,
  Container,
  AlertTriangle,
  Search,
  Key,
  Mail,
  MessageCircle,
  HelpCircle,
  Plus,
  Building2,
  MapPin,
  DollarSign,
  Receipt,
  Upload,
  Camera,
  Link,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  authService,
  type POSDriverInfo,
  type POSVehicleInfo,
  type POSPumpInfo,
  type POSFuelEntryCreate,
} from "@/lib/api/auth";
import { formatDate, formatDistance, formatFuelVolume, formatNumber, cn, matchesSearch } from "@/lib/utils";

type POSStep = "login" | "vehicle" | "pump" | "fuel" | "external" | "confirm" | "success";

interface FuelEntryData {
  lastPumpOdometer: string;
  newPumpOdometer: string;
  vehicleOdometer: string;
  liters: string;
}

interface ExternalFuelData {
  stationName: string;
  stationAddress: string;
  pricePerUnit: string;
  liters: string;
  totalCost: string;
  vehicleOdometer: string;
  receiptImage: string | null;
}

interface ValidationErrors {
  newPumpOdometer?: string;
  vehicleOdometer?: string;
  stationName?: string;
  pricePerUnit?: string;
  externalLiters?: string;
  externalOdometer?: string;
}

function FuelPOSPageContent() {
  const searchParams = useSearchParams();
  const urlPumpParam = searchParams.get("pump");

  const [step, setStep] = React.useState<POSStep>("login");
  const [selectedDriver, setSelectedDriver] = React.useState<POSDriverInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState<POSVehicleInfo | null>(null);
  const [pinCode, setPinCode] = React.useState("");
  const [pinError, setPinError] = React.useState(false);
  const [pinErrorMessage, setPinErrorMessage] = React.useState<string | null>(null);
  const [isValidatingPin, setIsValidatingPin] = React.useState(false);
  const [driverSearch, setDriverSearch] = React.useState("");
  const [fuelData, setFuelData] = React.useState<FuelEntryData>({
    lastPumpOdometer: "",
    newPumpOdometer: "",
    vehicleOdometer: "",
    liters: "",
  });
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrors>({});
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // API data state
  const [drivers, setDrivers] = React.useState<POSDriverInfo[]>([]);
  const [driverVehicles, setDriverVehicles] = React.useState<POSVehicleInfo[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = React.useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Pump state
  const [selectedPump, setSelectedPump] = React.useState<POSPumpInfo | null>(null);
  const [availablePumps, setAvailablePumps] = React.useState<POSPumpInfo[]>([]);
  const [isLoadingPumps, setIsLoadingPumps] = React.useState(false);

  // PIN management modals
  const [showForgotPinModal, setShowForgotPinModal] = React.useState(false);
  const [showChangePinModal, setShowChangePinModal] = React.useState(false);
  const [availableChannels, setAvailableChannels] = React.useState<string[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = React.useState(false);
  const [isPinResetLoading, setIsPinResetLoading] = React.useState(false);
  const [pinResetSuccess, setPinResetSuccess] = React.useState<string | null>(null);
  const [pinResetError, setPinResetError] = React.useState<string | null>(null);

  // Change PIN state
  const [currentPinInput, setCurrentPinInput] = React.useState("");
  const [newPinInput, setNewPinInput] = React.useState("");
  const [confirmPinInput, setConfirmPinInput] = React.useState("");
  const [isPinChangeLoading, setIsPinChangeLoading] = React.useState(false);
  const [pinChangeSuccess, setPinChangeSuccess] = React.useState<string | null>(null);
  const [pinChangeError, setPinChangeError] = React.useState<string | null>(null);

  // Custom date for backoffice backdating
  const [customDate, setCustomDate] = React.useState<string>("");

  // Vehicle search for backoffice
  const [vehicleSearch, setVehicleSearch] = React.useState("");

  // "Other Vehicle" modal state (for regular drivers)
  const [showOtherVehicleModal, setShowOtherVehicleModal] = React.useState(false);
  const [allVehicles, setAllVehicles] = React.useState<POSVehicleInfo[]>([]);
  const [isLoadingAllVehicles, setIsLoadingAllVehicles] = React.useState(false);
  const [otherVehicleSearch, setOtherVehicleSearch] = React.useState("");

  // External fuel entry state
  const [isExternalEntry, setIsExternalEntry] = React.useState(false);
  const [externalData, setExternalData] = React.useState<ExternalFuelData>({
    stationName: "",
    stationAddress: "",
    pricePerUnit: "",
    liters: "",
    totalCost: "",
    vehicleOdometer: "",
    receiptImage: null,
  });
  const [isDraggingImage, setIsDraggingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Set mounted state and initialize time on client only
  React.useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load drivers on mount (using public endpoint)
  React.useEffect(() => {
    const loadDrivers = async () => {
      try {
        setIsLoadingDrivers(true);
        const data = await authService.getPOSDrivers();
        setDrivers(data);
      } catch (err) {
        console.error("Failed to load drivers:", err);
      } finally {
        setIsLoadingDrivers(false);
      }
    };
    loadDrivers();
  }, []);

  // Load vehicles when driver is selected and step changes to vehicle
  React.useEffect(() => {
    const loadVehicles = async () => {
      if (!selectedDriver || step !== "vehicle") return;

      try {
        setIsLoadingVehicles(true);
        // Get vehicles assigned to this driver using public endpoint
        const vehicles = await authService.getPOSVehicles(selectedDriver.id);
        setDriverVehicles(vehicles);
      } catch (err) {
        console.error("Failed to load vehicles:", err);
        setDriverVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    loadVehicles();
  }, [selectedDriver, step]);

  // Load pumps when step changes to pump (after login)
  React.useEffect(() => {
    const loadPumps = async () => {
      if (!selectedDriver || step !== "pump") return;

      try {
        setIsLoadingPumps(true);
        // Get all pumps - vehicle selection comes after pump selection
        const pumps = await authService.getAllPOSPumps();
        setAvailablePumps(pumps);
      } catch (err) {
        console.error("Failed to load pumps:", err);
        setAvailablePumps([]);
      } finally {
        setIsLoadingPumps(false);
      }
    };
    loadPumps();
  }, [selectedDriver, step]);

  // Calculate distance since last fill (based on vehicle's current odometer vs entered odometer)
  const calculateDistanceTraveled = () => {
    if (!fuelData.vehicleOdometer || !selectedVehicle) return null;
    const currentOdometer = parseFloat(fuelData.vehicleOdometer);
    const lastOdometer = selectedVehicle.current_odometer;
    if (currentOdometer > lastOdometer) {
      return (currentOdometer - lastOdometer).toFixed(0);
    }
    return null;
  };

  // Calculate fuel consumption (km/L and L/100km)
  const calculateConsumption = () => {
    const distance = calculateDistanceTraveled();
    const liters = parseFloat(fuelData.liters);
    if (distance && liters > 0) {
      const distanceNum = parseFloat(distance);
      if (distanceNum > 0) {
        const kmPerLiter = distanceNum / liters;
        const litersPer100km = (liters / distanceNum) * 100;
        return {
          kmPerLiter: kmPerLiter.toFixed(2),
          litersPer100km: litersPer100km.toFixed(2),
        };
      }
    }
    return null;
  };

  // Validate new pump odometer
  const validateNewPumpOdometer = (value: string): string | undefined => {
    if (!value) {
      return "New pump odometer is required";
    }
    const newOdometer = parseFloat(value);
    const lastOdometer = parseFloat(fuelData.lastPumpOdometer) || 0;
    if (newOdometer <= lastOdometer) {
      return `Must be greater than ${formatNumber(lastOdometer)}`;
    }
    return undefined;
  };

  // Validate vehicle odometer
  const validateVehicleOdometer = (value: string): string | undefined => {
    if (!value) {
      return undefined; // Will be caught by required field
    }
    if (!selectedVehicle) return undefined;
    const newOdometer = parseFloat(value);
    const currentOdometer = selectedVehicle.current_odometer;
    if (newOdometer <= currentOdometer) {
      return `Must be greater than ${formatDistance(currentOdometer)}`;
    }
    return undefined;
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!fuelData.newPumpOdometer || !fuelData.vehicleOdometer || !fuelData.liters) {
      return false;
    }
    const pumpError = validateNewPumpOdometer(fuelData.newPumpOdometer);
    const vehicleError = validateVehicleOdometer(fuelData.vehicleOdometer);
    return !pumpError && !vehicleError;
  };

  const handlePinSubmit = async () => {
    if (!selectedDriver || pinCode.length !== 4) {
      setPinError(true);
      setPinErrorMessage("Please enter a 4-digit PIN");
      return;
    }

    setIsValidatingPin(true);
    setPinError(false);
    setPinErrorMessage(null);

    try {
      const isValid = await authService.validateDriverPin(selectedDriver.employee_id, pinCode);
      if (isValid) {
        // Check URL parameter for direct pump/external selection
        if (urlPumpParam) {
          if (urlPumpParam.toLowerCase() === "external") {
            // Direct to external entry
            setIsExternalEntry(true);
            setSelectedPump(null);
            setStep("vehicle");
          } else {
            // Try to find the pump by ID
            try {
              const pumps = await authService.getAllPOSPumps();
              const pumpId = urlPumpParam.trim();
              const targetPump = pumps.find((p) => p.id === pumpId);
              console.log("URL pump param:", pumpId);
              console.log("Available pumps:", pumps.map((p) => ({ id: p.id, name: p.name })));
              console.log("Found pump:", targetPump);
              if (targetPump) {
                setSelectedPump(targetPump);
                setIsExternalEntry(false);
                setFuelData((prev) => ({
                  ...prev,
                  lastPumpOdometer: targetPump.current_odometer.toString(),
                  newPumpOdometer: "",
                }));
                setStep("vehicle");
              } else {
                // Pump not found, go to pump selection
                console.warn("Pump not found with ID:", pumpId);
                setStep("pump");
              }
            } catch (err) {
              // Failed to load pumps, go to pump selection
              console.error("Failed to load pumps:", err);
              setStep("pump");
            }
          }
        } else {
          // No URL parameter, go to pump selection
          setStep("pump");
        }
      } else {
        setPinError(true);
        setPinErrorMessage("Invalid PIN. Please try again.");
      }
    } catch (err) {
      console.error("PIN validation error:", err);
      setPinError(true);
      setPinErrorMessage("PIN not set for this driver. Please contact an administrator.");
    } finally {
      setIsValidatingPin(false);
    }
  };

  const handleDriverSelect = (driver: POSDriverInfo) => {
    setSelectedDriver(driver);
    setPinCode("");
    setPinError(false);
    setPinErrorMessage(null);
    setDriverSearch("");
  };

  // Open Forgot PIN modal and load available channels
  const handleForgotPin = async () => {
    setShowForgotPinModal(true);
    setPinResetSuccess(null);
    setPinResetError(null);
    setIsLoadingChannels(true);

    try {
      const response = await authService.getMessagingChannels();
      setAvailableChannels(response.channels);
    } catch (err) {
      console.error("Failed to load messaging channels:", err);
      setPinResetError("Failed to load delivery options. Please try again.");
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Request PIN reset via selected channel
  const handlePinReset = async (channel: "email" | "whatsapp") => {
    if (!selectedDriver) return;

    setIsPinResetLoading(true);
    setPinResetError(null);
    setPinResetSuccess(null);

    try {
      const response = await authService.resetDriverPin(selectedDriver.employee_id, channel);
      setPinResetSuccess(response.message);
    } catch (err: unknown) {
      console.error("PIN reset error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to reset PIN. Please try again.";
      setPinResetError(errorMessage);
    } finally {
      setIsPinResetLoading(false);
    }
  };

  // Close Forgot PIN modal
  const closeForgotPinModal = () => {
    setShowForgotPinModal(false);
    setPinResetSuccess(null);
    setPinResetError(null);
  };

  // Open Change PIN modal
  const handleOpenChangePinModal = () => {
    setShowChangePinModal(true);
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmPinInput("");
    setPinChangeSuccess(null);
    setPinChangeError(null);
  };

  // Handle PIN change
  const handlePinChange = async () => {
    if (!selectedDriver) return;

    // Validate inputs
    if (currentPinInput.length !== 4) {
      setPinChangeError("Current PIN must be 4 digits");
      return;
    }
    if (newPinInput.length !== 4) {
      setPinChangeError("New PIN must be 4 digits");
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinChangeError("New PINs do not match");
      return;
    }
    if (currentPinInput === newPinInput) {
      setPinChangeError("New PIN must be different from current PIN");
      return;
    }

    setIsPinChangeLoading(true);
    setPinChangeError(null);
    setPinChangeSuccess(null);

    try {
      const response = await authService.changeDriverPin(
        selectedDriver.employee_id,
        currentPinInput,
        newPinInput
      );
      setPinChangeSuccess(response.message);
      // Clear inputs on success
      setCurrentPinInput("");
      setNewPinInput("");
      setConfirmPinInput("");
    } catch (err: unknown) {
      console.error("PIN change error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to change PIN. Please try again.";
      setPinChangeError(errorMessage);
    } finally {
      setIsPinChangeLoading(false);
    }
  };

  // Close Change PIN modal
  const closeChangePinModal = () => {
    setShowChangePinModal(false);
    setPinChangeSuccess(null);
    setPinChangeError(null);
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmPinInput("");
  };

  const handleVehicleSelect = (vehicle: POSVehicleInfo) => {
    setSelectedVehicle(vehicle);
    setValidationErrors({});

    if (isExternalEntry) {
      // External entry flow: pump → vehicle → external
      setExternalData((prev) => ({
        ...prev,
        vehicleOdometer: vehicle.current_odometer.toString(),
      }));
      setStep("external");
    } else {
      // Internal pump flow: pump → vehicle → fuel
      setFuelData((prev) => ({
        ...prev,
        vehicleOdometer: vehicle.current_odometer.toString(),
        liters: "",
      }));
      setStep("fuel");
    }
  };

  // "Other Vehicle" modal handlers
  const handleOpenOtherVehicle = async () => {
    if (!selectedDriver) return;

    setShowOtherVehicleModal(true);
    setOtherVehicleSearch("");
    setIsLoadingAllVehicles(true);

    try {
      const vehicles = await authService.getPOSVehicles(selectedDriver.id, true);
      setAllVehicles(vehicles);
    } catch (err) {
      console.error("Failed to load all vehicles:", err);
      setAllVehicles([]);
    } finally {
      setIsLoadingAllVehicles(false);
    }
  };

  const handleSelectOtherVehicle = (vehicle: POSVehicleInfo) => {
    setShowOtherVehicleModal(false);
    setOtherVehicleSearch("");
    handleVehicleSelect(vehicle);
  };

  const handlePumpSelect = (pump: POSPumpInfo) => {
    setSelectedPump(pump);
    setIsExternalEntry(false);
    setFuelData((prev) => ({
      ...prev,
      lastPumpOdometer: pump.current_odometer.toString(),
      newPumpOdometer: "",
    }));
    setValidationErrors({});
    setSelectedVehicle(null);
    setVehicleSearch("");
    setStep("vehicle");
  };

  // External station handlers
  const handleSelectExternalStation = () => {
    setIsExternalEntry(true);
    setSelectedPump(null);
    setSelectedVehicle(null);
    setVehicleSearch("");
    setValidationErrors({});
    setStep("vehicle");
  };

  const handleExternalDataChange = (field: keyof ExternalFuelData, value: string) => {
    setExternalData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate total cost when price and liters change
      if ((field === "pricePerUnit" || field === "liters") && updated.pricePerUnit && updated.liters) {
        const price = parseFloat(updated.pricePerUnit) || 0;
        const liters = parseFloat(updated.liters) || 0;
        updated.totalCost = (price * liters).toFixed(2);
      }

      return updated;
    });
  };

  // Image upload handlers
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setExternalData((prev) => ({
        ...prev,
        receiptImage: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleImageFile(file);
        }
        break;
      }
    }
  };

  const handleImageUrlImport = async () => {
    const url = prompt("Enter image URL:");
    if (url) {
      try {
        // Try to fetch and convert to base64
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          setExternalData((prev) => ({
            ...prev,
            receiptImage: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(blob);
      } catch {
        // If fetch fails, just store the URL directly
        setExternalData((prev) => ({
          ...prev,
          receiptImage: url,
        }));
      }
    }
  };

  const handleCameraCapture = () => {
    // Trigger file input with capture attribute
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    setExternalData((prev) => ({
      ...prev,
      receiptImage: null,
    }));
  };

  const handleExternalSubmit = () => {
    setStep("confirm");
  };

  const handleFuelSubmit = () => {
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedVehicle || !selectedDriver) return;

    // For internal entries, pump is required
    if (!isExternalEntry && !selectedPump) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setShowSuccessDialog(true);

    try {
      let fuelEntryData: POSFuelEntryCreate;

      if (isExternalEntry) {
        // External station entry
        fuelEntryData = {
          employee_id: selectedDriver.id,
          vehicle_id: selectedVehicle.id,
          odometer: parseFloat(externalData.vehicleOdometer),
          volume: parseFloat(externalData.liters),
          is_external: true,
          station_name: externalData.stationName,
          station_address: externalData.stationAddress || undefined,
          price_per_unit: parseFloat(externalData.pricePerUnit),
          total_cost: parseFloat(externalData.totalCost),
          receipt_image: externalData.receiptImage || undefined,
          // Include custom date if backoffice driver is backdating
          ...(selectedDriver.is_backoffice && customDate ? { date: customDate } : {}),
        };
      } else {
        // Internal pump entry
        fuelEntryData = {
          employee_id: selectedDriver.id,
          vehicle_id: selectedVehicle.id,
          pump_id: selectedPump!.id,
          odometer: parseFloat(fuelData.vehicleOdometer),
          volume: parseFloat(fuelData.liters),
          pump_odometer: parseFloat(fuelData.newPumpOdometer),
          is_external: false,
          notes: `Last Pump Odometer: ${fuelData.lastPumpOdometer}`,
          // Include custom date if backoffice driver is backdating
          ...(selectedDriver.is_backoffice && customDate ? { date: customDate } : {}),
        };
      }

      await authService.createPOSFuelEntry(fuelEntryData);

      setShowSuccessDialog(false);
      setStep("success");
    } catch (err) {
      console.error("Failed to save fuel entry:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save fuel entry");
      setShowSuccessDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetExternalData = () => {
    setIsExternalEntry(false);
    setExternalData({
      stationName: "",
      stationAddress: "",
      pricePerUnit: "",
      liters: "",
      totalCost: "",
      vehicleOdometer: "",
      receiptImage: null,
    });
  };

  const handleNewEntry = () => {
    setSelectedPump(null);
    setSelectedVehicle(null);
    setIsExternalEntry(false);
    setFuelData({ lastPumpOdometer: "", newPumpOdometer: "", vehicleOdometer: "", liters: "" });
    setValidationErrors({});
    setCustomDate("");
    setVehicleSearch("");
    setShowOtherVehicleModal(false);
    setOtherVehicleSearch("");
    resetExternalData();
    setStep("pump");
  };

  const handleLogout = () => {
    setSelectedDriver(null);
    setSelectedVehicle(null);
    setSelectedPump(null);
    setPinCode("");
    setDriverSearch("");
    setVehicleSearch("");
    setShowOtherVehicleModal(false);
    setOtherVehicleSearch("");
    setAllVehicles([]);
    setFuelData({ lastPumpOdometer: "", newPumpOdometer: "", vehicleOdometer: "", liters: "" });
    setValidationErrors({});
    setCustomDate("");
    resetExternalData();
    setStep("login");
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "Loading...";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary shadow-lg shrink-0">
              <Fuel className="h-5 w-5 md:h-7 md:w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Fuel Station</h1>
              <p className="text-xs md:text-sm text-muted-foreground">FleetOptima POS</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl md:text-3xl font-bold tabular-nums text-foreground">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">
              {formatDateDisplay(currentTime)}
            </div>
          </div>
        </div>

        {/* Driver info bar */}
        {selectedDriver && step !== "login" && step !== "fuel" && (
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-card p-3 md:p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm md:text-base shrink-0">
                {selectedDriver.first_name[0]}{selectedDriver.last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm md:text-base truncate">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">ID: {selectedDriver.employee_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleOpenChangePinModal} className="h-8 md:h-9">
                <Key className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Change PIN</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 md:h-9">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step: Login */}
        {step === "login" && (
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Driver Login</CardTitle>
              <CardDescription>Select your name and enter your PIN</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedDriver ? (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoadingDrivers ? (
                      <>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : drivers.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <User className="h-12 w-12 mb-2 opacity-50" />
                        <p>No drivers available</p>
                      </div>
                    ) : (
                      drivers
                        .slice()
                        .sort((a, b) => {
                          const firstNameCompare = a.first_name.localeCompare(b.first_name);
                          if (firstNameCompare !== 0) return firstNameCompare;
                          return a.last_name.localeCompare(b.last_name);
                        })
                        .filter((driver) => {
                          return matchesSearch([driver.first_name, driver.last_name, driver.employee_id], driverSearch);
                        })
                        .map((driver) => (
                          <button
                            key={driver.id}
                            onClick={() => handleDriverSelect(driver)}
                            className="flex items-center gap-3 rounded-xl border-2 border-transparent bg-muted/50 p-4 text-left transition-all hover:border-primary hover:bg-accent hover:shadow-md"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                              {driver.first_name[0]}{driver.last_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold">{driver.first_name} {driver.last_name}</p>
                              <p className="text-sm text-muted-foreground">{driver.employee_id}</p>
                            </div>
                          </button>
                        ))
                    )}
                    {!isLoadingDrivers && drivers.length > 0 && driverSearch.trim() &&
                      drivers.filter((driver) => {
                        return matchesSearch([driver.first_name, driver.last_name, driver.employee_id], driverSearch);
                      }).length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Search className="h-12 w-12 mb-2 opacity-50" />
                          <p>No drivers match "{driverSearch}"</p>
                        </div>
                      )
                    }
                  </div>
                </>
              ) : (
                <div className="mx-auto max-w-sm space-y-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                      {selectedDriver.first_name[0]}{selectedDriver.last_name[0]}
                    </div>
                    <p className="text-xl font-semibold">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDriver(null)}>
                      Change Driver
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-center block">Enter 4-digit PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => {
                        setPinCode(e.target.value.replace(/\D/g, ""));
                        setPinError(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                      className={cn(
                        "text-center text-2xl tracking-[0.5em] h-14",
                        pinError && "border-destructive"
                      )}
                      placeholder="••••"
                      autoFocus
                    />
                    {pinError && pinErrorMessage && (
                      <p className="text-sm text-destructive text-center">{pinErrorMessage}</p>
                    )}
                  </div>
                  <Button onClick={handlePinSubmit} className="w-full h-12 text-lg" disabled={pinCode.length !== 4 || isValidatingPin}>
                    {isValidatingPin ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Forgot PIN?
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Vehicle Selection */}
        {step === "vehicle" && (
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setStep("pump")} className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">Select Vehicle</CardTitle>
                  <CardDescription>Choose the vehicle you are refueling</CardDescription>
                </div>
              </div>
              {/* Selected pump/external badge */}
              <div className="flex items-center gap-2 mt-3">
                {isExternalEntry ? (
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    External Station
                  </Badge>
                ) : selectedPump && (
                  <Badge variant="secondary" className="gap-1">
                    <Container className="h-3 w-3" />
                    {selectedPump.name} • {selectedPump.fuel_type.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search bar for backoffice drivers */}
              {selectedDriver?.is_backoffice && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by plate, make or model..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              )}

              {isLoadingVehicles ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col rounded-xl bg-muted/50 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-8 w-32 mb-1" />
                      <Skeleton className="h-4 w-40 mb-3" />
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : driverVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Truck className="h-12 w-12 mb-2 opacity-50" />
                  <p>No vehicles available</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {driverVehicles
                    .filter((vehicle) => {
                      if (!selectedDriver?.is_backoffice) return true;
                      return matchesSearch([vehicle.registration_plate, vehicle.make, vehicle.model], vehicleSearch);
                    })
                    .map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="flex flex-col rounded-xl border-2 border-transparent bg-muted/50 p-5 text-left transition-all hover:border-primary hover:bg-accent hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Truck className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {vehicle.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold mb-1">{vehicle.registration_plate}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </p>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Odometer</p>
                          <p className="font-semibold tabular-nums">{formatDistance(vehicle.current_odometer)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fuel Type</p>
                          <p className="font-semibold uppercase">{vehicle.fuel_type}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {/* "Other Vehicle" card for regular (non-backoffice) drivers */}
                  {!selectedDriver?.is_backoffice && (
                    <button
                      onClick={handleOpenOtherVehicle}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center transition-all hover:border-primary hover:bg-accent hover:shadow-md min-h-[200px]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold text-muted-foreground mb-1">Other Vehicle</p>
                      <p className="text-sm text-muted-foreground">
                        Select a vehicle not assigned to you
                      </p>
                    </button>
                  )}
                  {/* No results message for vehicle search */}
                  {selectedDriver?.is_backoffice && vehicleSearch.trim() &&
                    driverVehicles.filter((vehicle) => {
                      return matchesSearch([vehicle.registration_plate, vehicle.make, vehicle.model], vehicleSearch);
                    }).length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Search className="h-12 w-12 mb-2 opacity-50" />
                        <p>No vehicles match "{vehicleSearch}"</p>
                      </div>
                    )
                  }
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Pump Selection */}
        {step === "pump" && selectedDriver && (
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={handleLogout} className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">Select Fuel Source</CardTitle>
                  <CardDescription>
                    Choose an internal pump or external station
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPumps ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col rounded-xl bg-muted/50 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-4 w-24 mb-4" />
                      <Skeleton className="h-2 w-full mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : availablePumps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mb-2 text-amber-500" />
                  <p className="text-lg font-medium">No Pumps Available</p>
                  <p className="text-sm">
                    No active pumps with fuel available. Use external station instead.
                  </p>
                  {/* External Station Card when no internal pumps */}
                  <button
                    onClick={handleSelectExternalStation}
                    className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center transition-all hover:border-primary hover:bg-accent hover:shadow-md w-64"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 mb-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-muted-foreground mb-1">External Station</p>
                    <p className="text-sm text-muted-foreground">
                      BP, Shell, Galp, etc.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availablePumps.map((pump) => {
                    const levelPercentage = pump.level_percentage ?? (pump.capacity > 0 ? (pump.current_level / pump.capacity) * 100 : 0);
                    const isLow = levelPercentage <= 20;
                    const isWarning = levelPercentage > 20 && levelPercentage <= 40;

                    return (
                      <button
                        key={pump.id}
                        onClick={() => handlePumpSelect(pump)}
                        className="flex flex-col rounded-xl border-2 border-transparent bg-muted/50 p-5 text-left transition-all hover:border-primary hover:bg-accent hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            isLow ? "bg-red-100 dark:bg-red-950" : isWarning ? "bg-amber-100 dark:bg-amber-950" : "bg-primary/10"
                          )}>
                            <Container className={cn(
                              "h-6 w-6",
                              isLow ? "text-red-600" : isWarning ? "text-amber-600" : "text-primary"
                            )} />
                          </div>
                          <Badge variant={isLow ? "destructive" : isWarning ? "secondary" : "outline"}>
                            {levelPercentage.toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-xl font-bold mb-1">{pump.name}</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {pump.code} • {pump.fuel_type.toUpperCase()}
                        </p>
                        <div className="space-y-2">
                          <Progress
                            value={levelPercentage}
                            className={cn(
                              "h-2",
                              isLow && "[&>div]:bg-red-500",
                              isWarning && "[&>div]:bg-amber-500"
                            )}
                          />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {formatNumber(pump.current_level)} L
                            </span>
                            <span className="text-muted-foreground">
                              / {formatNumber(pump.capacity)} L
                            </span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Gauge className="h-4 w-4" />
                            Odometer
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatNumber(pump.current_odometer)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {/* External Station Card */}
                  <button
                    onClick={handleSelectExternalStation}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center transition-all hover:border-primary hover:bg-accent hover:shadow-md min-h-[200px]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 mb-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-muted-foreground mb-1">External Station</p>
                    <p className="text-sm text-muted-foreground">
                      BP, Shell, Galp, etc.
                    </p>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Fuel Entry */}
        {step === "fuel" && selectedVehicle && selectedPump && selectedDriver && (
          <Card className="shadow-xl">
            <CardHeader className="pb-2 space-y-3">
              {/* Mobile: Driver info bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-muted/50 p-3 md:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                    {selectedDriver.first_name[0]}{selectedDriver.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">ID: {selectedDriver.employee_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleOpenChangePinModal} className="h-8">
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="h-8">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Header row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setStep("vehicle")} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-xl md:text-2xl">Log Fuel Entry</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Enter pump and vehicle readings</CardDescription>
                  </div>
                </div>
                {/* Desktop: Driver info bar */}
                <div className="hidden md:flex items-center gap-8 rounded-lg bg-muted/50 px-6 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                      {selectedDriver.first_name[0]}{selectedDriver.last_name[0]}
                    </div>
                    <div className="min-w-[280px]">
                      <p className="font-semibold">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                      <p className="text-sm text-muted-foreground">ID: {selectedDriver.employee_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleOpenChangePinModal}>
                      <Key className="mr-2 h-4 w-4" />
                      Change PIN
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Vehicle & Pump Info Cards - Side by Side on desktop, stacked on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Vehicle Card */}
                <div className="rounded-xl bg-muted/50 p-3 md:p-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <Truck className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-2xl font-bold truncate">{selectedVehicle.registration_plate}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs md:text-sm text-muted-foreground">Odometer</p>
                      <p className="text-base md:text-xl font-bold tabular-nums">{formatDistance(selectedVehicle.current_odometer)}</p>
                    </div>
                  </div>
                </div>

                {/* Pump Card */}
                <div className="rounded-xl bg-green-50 dark:bg-green-950/30 p-3 md:p-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950 shrink-0">
                      <Container className="h-5 w-5 md:h-7 md:w-7 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base md:text-xl font-bold truncate">{selectedPump.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {selectedPump.code} • {selectedPump.fuel_type.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs md:text-sm text-muted-foreground">Available</p>
                      <p className="text-base md:text-xl font-bold tabular-nums text-green-600">
                        {formatNumber(selectedPump.current_level)} L
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-filled Info */}
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="rounded-lg border bg-card p-2 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm">Date</span>
                    {selectedDriver?.is_backoffice && (
                      <Badge variant="secondary" className="text-xs ml-auto">Editable</Badge>
                    )}
                  </div>
                  {selectedDriver?.is_backoffice ? (
                    <Input
                      type="date"
                      value={customDate || (currentTime ? currentTime.toISOString().split('T')[0] : '')}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="h-9 md:h-10 text-sm md:text-base font-semibold"
                      max={currentTime ? currentTime.toISOString().split('T')[0] : undefined}
                    />
                  ) : (
                    <p className="text-sm md:text-lg font-semibold">{formatDateDisplay(currentTime)}</p>
                  )}
                </div>
                <div className="rounded-lg border bg-card p-2 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm">Time</span>
                  </div>
                  <p className="text-sm md:text-lg font-semibold tabular-nums">{formatTime(currentTime)}</p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3 md:space-y-4">
                {/* Pump Odometer Fields */}
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="lastPumpOdometer" className="text-sm md:text-base flex items-center gap-2">
                      <Gauge className="h-3 w-3 md:h-4 md:w-4" />
                      Last Pump Odometer
                    </Label>
                    <Input
                      id="lastPumpOdometer"
                      type="number"
                      value={fuelData.lastPumpOdometer}
                      className="h-11 md:h-14 text-base md:text-xl tabular-nums bg-muted cursor-not-allowed"
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Reading before fueling (from pump)</p>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="newPumpOdometer" className="text-sm md:text-base flex items-center gap-2">
                      <Gauge className="h-3 w-3 md:h-4 md:w-4" />
                      New Pump Odometer *
                    </Label>
                    <Input
                      id="newPumpOdometer"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={fuelData.newPumpOdometer}
                      onChange={(e) => {
                        const newValue = e.target.value.replace(/[^0-9]/g, "");
                        const lastOdometer = parseFloat(fuelData.lastPumpOdometer) || 0;
                        const newOdometer = parseFloat(newValue) || 0;
                        const calculatedLiters = newOdometer > lastOdometer ? (newOdometer - lastOdometer).toFixed(2) : "";
                        setFuelData({
                          ...fuelData,
                          newPumpOdometer: newValue,
                          liters: calculatedLiters,
                        });
                        // Validate and set error
                        const error = validateNewPumpOdometer(newValue);
                        setValidationErrors((prev) => ({ ...prev, newPumpOdometer: error }));
                      }}
                      placeholder="Enter new pump reading"
                      className={cn(
                        "h-11 md:h-14 text-base md:text-xl tabular-nums",
                        validationErrors.newPumpOdometer && "border-destructive"
                      )}
                      required
                    />
                    {validationErrors.newPumpOdometer ? (
                      <p className="text-xs text-destructive">{validationErrors.newPumpOdometer}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Reading after fueling</p>
                    )}
                  </div>
                </div>

                {/* Vehicle Odometer & Liters Pumped */}
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="vehicleOdometer" className="text-sm md:text-base flex items-center gap-2">
                      <Gauge className="h-3 w-3 md:h-4 md:w-4" />
                      Vehicle Odometer *
                    </Label>
                    <Input
                      id="vehicleOdometer"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={fuelData.vehicleOdometer}
                      onChange={(e) => {
                        const newValue = e.target.value.replace(/[^0-9]/g, "");
                        setFuelData({ ...fuelData, vehicleOdometer: newValue });
                        // Validate and set error
                        const error = validateVehicleOdometer(newValue);
                        setValidationErrors((prev) => ({ ...prev, vehicleOdometer: error }));
                      }}
                      placeholder="Enter vehicle odometer"
                      className={cn(
                        "h-11 md:h-14 text-base md:text-xl tabular-nums",
                        validationErrors.vehicleOdometer && "border-destructive"
                      )}
                      required
                    />
                    {validationErrors.vehicleOdometer && (
                      <p className="text-xs text-destructive">{validationErrors.vehicleOdometer}</p>
                    )}
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="liters" className="text-sm md:text-base flex items-center gap-2">
                      <Droplets className="h-3 w-3 md:h-4 md:w-4" />
                      Liters Pumped *
                    </Label>
                    <Input
                      id="liters"
                      type="number"
                      step="0.01"
                      value={fuelData.liters}
                      onChange={(e) => setFuelData({ ...fuelData, liters: e.target.value })}
                      placeholder="Enter liters"
                      className="h-11 md:h-14 text-base md:text-xl tabular-nums"
                      required
                    />
                  </div>
                </div>

                {/* Distance & Consumption Preview */}
                {fuelData.vehicleOdometer && fuelData.liters && parseFloat(fuelData.liters) > 0 && (
                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 md:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                        <span className="text-xs md:text-sm font-medium">Distance:</span>
                        <span className="text-base md:text-xl font-bold text-primary tabular-nums">
                          {calculateDistanceTraveled()
                            ? formatDistance(parseFloat(calculateDistanceTraveled()!))
                            : "0 km"}
                        </span>
                      </div>
                      {calculateConsumption() ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 md:h-5 md:w-5 text-success shrink-0" />
                            <span className="text-xs md:text-sm font-medium">Efficiency:</span>
                            <span className="text-base md:text-xl font-bold text-success tabular-nums">
                              {calculateConsumption()!.kmPerLiter} km/L
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 md:h-5 md:w-5 text-blue-500 shrink-0" />
                            <span className="text-xs md:text-sm font-medium">Consumption:</span>
                            <span className="text-base md:text-xl font-bold text-blue-500 tabular-nums">
                              {calculateConsumption()!.litersPer100km} L/100km
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                            <span className="text-xs md:text-sm font-medium">Efficiency:</span>
                            <span className="text-base md:text-xl font-bold text-muted-foreground tabular-nums">
                              N/A
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                            <span className="text-xs md:text-sm font-medium">Consumption:</span>
                            <span className="text-base md:text-xl font-bold text-muted-foreground tabular-nums">
                              N/A
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleFuelSubmit}
                className="w-full h-11 md:h-14 text-base md:text-lg"
                disabled={!isFormValid()}
              >
                Review Entry
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: External Fuel Entry */}
        {step === "external" && selectedVehicle && selectedDriver && (
          <Card className="shadow-xl">
            <CardHeader className="pb-2 space-y-3">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setStep("vehicle")} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-xl md:text-2xl">External Fuel Entry</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Enter fuel purchase from external station
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                    <p className="text-muted-foreground text-xs">ID: {selectedDriver.employee_id}</p>
                  </div>
                  <div className="flex gap-1 ml-auto md:ml-0">
                    <Button variant="ghost" size="icon" onClick={handleOpenChangePinModal} className="h-8 w-8">
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleLogout} className="h-8 w-8">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vehicle and Station Info */}
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 mt-2">
                <div className="rounded-lg bg-muted/50 p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Truck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-bold truncate">{selectedVehicle.registration_plate}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Odometer</p>
                      <p className="font-bold tabular-nums">{formatDistance(selectedVehicle.current_odometer)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                      <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold text-blue-600">External Station</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Gas station purchase
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Date (editable for backoffice) */}
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="rounded-lg border bg-card p-2 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm">Date</span>
                    {selectedDriver?.is_backoffice && (
                      <Badge variant="secondary" className="text-xs ml-auto">Editable</Badge>
                    )}
                  </div>
                  {selectedDriver?.is_backoffice ? (
                    <Input
                      type="date"
                      value={customDate || (currentTime ? currentTime.toISOString().split('T')[0] : '')}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="h-9 md:h-10 text-sm md:text-base font-semibold"
                      max={currentTime ? currentTime.toISOString().split('T')[0] : undefined}
                    />
                  ) : (
                    <p className="text-sm md:text-lg font-semibold">{formatDateDisplay(currentTime)}</p>
                  )}
                </div>
                <div className="rounded-lg border bg-card p-2 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm">Time</span>
                  </div>
                  <p className="text-sm md:text-lg font-semibold tabular-nums">{formatTime(currentTime)}</p>
                </div>
              </div>

              {/* Station Name */}
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="stationName" className="text-sm md:text-base flex items-center gap-2">
                  <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                  Station Name *
                </Label>
                <Input
                  id="stationName"
                  type="text"
                  value={externalData.stationName}
                  onChange={(e) => handleExternalDataChange("stationName", e.target.value)}
                  placeholder="e.g., BP, Shell, Galp, Repsol..."
                  className="h-11 md:h-14 text-base md:text-lg"
                  required
                />
              </div>

              {/* Station Address (optional) */}
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="stationAddress" className="text-sm md:text-base flex items-center gap-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  Station Address (optional)
                </Label>
                <Input
                  id="stationAddress"
                  type="text"
                  value={externalData.stationAddress}
                  onChange={(e) => handleExternalDataChange("stationAddress", e.target.value)}
                  placeholder="Enter station address..."
                  className="h-10 md:h-12"
                />
              </div>

              {/* Price and Volume */}
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="pricePerUnit" className="text-sm md:text-base flex items-center gap-2">
                    <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                    Price/Liter *
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="text"
                    inputMode="decimal"
                    value={externalData.pricePerUnit}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                      handleExternalDataChange("pricePerUnit", value);
                    }}
                    placeholder="0.00"
                    className="h-11 md:h-14 text-base md:text-xl tabular-nums"
                    required
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="externalLiters" className="text-sm md:text-base flex items-center gap-2">
                    <Droplets className="h-3 w-3 md:h-4 md:w-4" />
                    Liters *
                  </Label>
                  <Input
                    id="externalLiters"
                    type="text"
                    inputMode="decimal"
                    value={externalData.liters}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                      handleExternalDataChange("liters", value);
                    }}
                    placeholder="0.00"
                    className="h-11 md:h-14 text-base md:text-xl tabular-nums"
                    required
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="totalCost" className="text-sm md:text-base flex items-center gap-2">
                    <Receipt className="h-3 w-3 md:h-4 md:w-4" />
                    Total Cost
                  </Label>
                  <Input
                    id="totalCost"
                    type="text"
                    inputMode="decimal"
                    value={externalData.totalCost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                      handleExternalDataChange("totalCost", value);
                    }}
                    placeholder="Auto-calculated"
                    className="h-11 md:h-14 text-base md:text-xl tabular-nums bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated from price × liters</p>
                </div>
              </div>

              {/* Vehicle Odometer */}
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="externalOdometer" className="text-sm md:text-base flex items-center gap-2">
                  <Gauge className="h-3 w-3 md:h-4 md:w-4" />
                  Vehicle Odometer *
                </Label>
                <Input
                  id="externalOdometer"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={externalData.vehicleOdometer}
                  onChange={(e) => {
                    const newValue = e.target.value.replace(/[^0-9]/g, "");
                    handleExternalDataChange("vehicleOdometer", newValue);
                  }}
                  placeholder="Enter vehicle odometer"
                  className="h-11 md:h-14 text-base md:text-xl tabular-nums"
                  required
                />
              </div>

              {/* Receipt Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm md:text-base flex items-center gap-2">
                  <Receipt className="h-3 w-3 md:h-4 md:w-4" />
                  Receipt / Document (optional)
                </Label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = "";
                  }}
                />

                {externalData.receiptImage ? (
                  <div className="relative rounded-lg border-2 border-primary bg-primary/5 p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={externalData.receiptImage}
                        alt="Receipt"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-2">Receipt uploaded</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={handleImageDrop}
                    onPaste={handleImagePaste}
                    className={cn(
                      "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                      isDraggingImage
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/30 hover:border-muted-foreground/50"
                    )}
                  >
                    <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag & drop image here, or paste from clipboard
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1"
                      >
                        <Upload className="h-4 w-4" />
                        Browse
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCameraCapture}
                        className="gap-1"
                      >
                        <Camera className="h-4 w-4" />
                        Camera
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleImageUrlImport}
                        className="gap-1"
                      >
                        <Link className="h-4 w-4" />
                        URL
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <Button
                  onClick={handleExternalSubmit}
                  className="w-full h-11 md:h-14 text-base md:text-lg"
                  disabled={
                    !externalData.stationName ||
                    !externalData.pricePerUnit ||
                    !externalData.liters ||
                    !externalData.vehicleOdometer
                  }
                >
                  Review Entry
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && selectedVehicle && selectedDriver && (isExternalEntry || selectedPump) && (
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setStep(isExternalEntry ? "external" : "fuel")} className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl md:text-2xl">Confirm Entry</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Please review before submitting</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="rounded-xl bg-muted/50 p-3 md:p-6 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Driver</p>
                    <p className="text-sm md:text-lg font-semibold">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Vehicle</p>
                    <p className="text-sm md:text-lg font-semibold">{selectedVehicle.registration_plate}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">{isExternalEntry ? "Station" : "Fuel Pump"}</p>
                    {isExternalEntry ? (
                      <>
                        <p className="text-sm md:text-lg font-semibold text-blue-600">{externalData.stationName}</p>
                        {externalData.stationAddress && (
                          <p className="text-xs text-muted-foreground">{externalData.stationAddress}</p>
                        )}
                        <Badge variant="secondary" className="text-xs mt-1">External</Badge>
                      </>
                    ) : (
                      <>
                        <p className="text-sm md:text-lg font-semibold">{selectedPump?.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedPump?.code}</p>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Date & Time</p>
                    {customDate && selectedDriver?.is_backoffice ? (
                      <>
                        <p className="text-sm md:text-base font-semibold text-amber-600">
                          {new Date(customDate + 'T00:00:00').toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">Backdated</Badge>
                      </>
                    ) : (
                      <p className="text-sm md:text-base font-semibold">{formatDateDisplay(currentTime)}</p>
                    )}
                    <p className="text-sm md:text-base font-semibold tabular-nums">{formatTime(currentTime)}</p>
                  </div>
                  {isExternalEntry ? (
                    <>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Price per Liter</p>
                        <p className="text-sm md:text-lg font-semibold tabular-nums">
                          €{formatNumber(parseFloat(externalData.pricePerUnit))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-sm md:text-lg font-semibold tabular-nums text-primary">
                          €{formatNumber(parseFloat(externalData.totalCost))}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Last Pump Odometer</p>
                        <p className="text-sm md:text-lg font-semibold tabular-nums">
                          {formatNumber(parseFloat(fuelData.lastPumpOdometer))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">New Pump Odometer</p>
                        <p className="text-sm md:text-lg font-semibold tabular-nums text-primary">
                          {formatNumber(parseFloat(fuelData.newPumpOdometer))}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Vehicle Odometer</p>
                    <p className="text-lg md:text-2xl font-bold tabular-nums text-primary">
                      {formatDistance(parseFloat(isExternalEntry ? externalData.vehicleOdometer : fuelData.vehicleOdometer))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Liters {isExternalEntry ? "Purchased" : "Pumped"}</p>
                    <p className="text-lg md:text-2xl font-bold tabular-nums text-primary">
                      {formatFuelVolume(parseFloat(isExternalEntry ? externalData.liters : fuelData.liters))}
                    </p>
                  </div>
                </div>

                {/* Receipt image preview for external entries */}
                {isExternalEntry && externalData.receiptImage && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2">Receipt Attached</p>
                      <img
                        src={externalData.receiptImage}
                        alt="Receipt"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  </>
                )}

                {!isExternalEntry && calculateDistanceTraveled() && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Distance Traveled</p>
                        <p className="text-base md:text-xl font-bold tabular-nums text-primary">
                          {formatDistance(parseFloat(calculateDistanceTraveled()!))}
                        </p>
                      </div>
                      {calculateConsumption() && (
                        <>
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Efficiency</p>
                            <p className="text-base md:text-xl font-bold tabular-nums text-success">
                              {calculateConsumption()!.kmPerLiter} km/L
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Consumption</p>
                            <p className="text-base md:text-xl font-bold tabular-nums text-blue-500">
                              {calculateConsumption()!.litersPer100km} L/100km
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {submitError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 md:p-4 flex items-start gap-2 md:gap-3">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm md:text-base font-medium text-destructive">Failed to save entry</p>
                    <p className="text-xs md:text-sm text-destructive/80">{submitError}</p>
                  </div>
                </div>
              )}

              <div>
                <Button onClick={handleConfirm} className="w-full h-11 md:h-14 text-sm md:text-lg bg-success hover:bg-success/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                      Confirm
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <Card className="shadow-xl">
            <CardContent className="py-8 md:py-12">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-success/10 mb-4 md:mb-6">
                  <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-success" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Entry Saved!</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                  Fuel entry has been recorded successfully.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                  <Button variant="outline" onClick={handleLogout} className="h-11 md:h-12 px-6 md:px-8">
                    <LogOut className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Logout
                  </Button>
                  <Button onClick={handleNewEntry} className="h-11 md:h-12 px-6 md:px-8">
                    <Fuel className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    New Entry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog}>
        <DialogContent className="text-center">
          <div className="flex flex-col items-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4 animate-pulse">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-xl">Saving Entry...</DialogTitle>
            <DialogDescription>Please wait</DialogDescription>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot PIN Modal */}
      <Dialog open={showForgotPinModal} onOpenChange={closeForgotPinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Your PIN
            </DialogTitle>
            <DialogDescription>
              {selectedDriver
                ? `We'll send a new PIN to ${selectedDriver.first_name} ${selectedDriver.last_name}`
                : "Select how you'd like to receive your new PIN"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingChannels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pinResetSuccess ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-medium text-success">{pinResetSuccess}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please check your {pinResetSuccess.includes("email") ? "email" : "phone"} for the new PIN.
                </p>
                <Button onClick={closeForgotPinModal} className="mt-4">
                  Done
                </Button>
              </div>
            ) : pinResetError ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-lg font-medium text-destructive">Unable to Reset PIN</p>
                <p className="text-sm text-muted-foreground mt-2">{pinResetError}</p>
                <Button variant="outline" onClick={() => setPinResetError(null)} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : availableChannels.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-lg font-medium">No Delivery Options Available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please contact your administrator to reset your PIN.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableChannels.includes("email") && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start"
                    onClick={() => handlePinReset("email")}
                    disabled={isPinResetLoading}
                  >
                    <Mail className="h-5 w-5 mr-3 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">Send via Email</p>
                      <p className="text-sm text-muted-foreground">
                        Receive new PIN in your email
                      </p>
                    </div>
                    {isPinResetLoading && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
                  </Button>
                )}
                {availableChannels.includes("whatsapp") && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-start"
                    onClick={() => handlePinReset("whatsapp")}
                    disabled={isPinResetLoading}
                  >
                    <MessageCircle className="h-5 w-5 mr-3 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium">Send via WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        Receive new PIN on WhatsApp
                      </p>
                    </div>
                    {isPinResetLoading && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Modal */}
      <Dialog open={showChangePinModal} onOpenChange={closeChangePinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Your PIN
            </DialogTitle>
            <DialogDescription>
              Enter your current PIN and choose a new 4-digit PIN
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pinChangeSuccess ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-medium text-success">{pinChangeSuccess}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your PIN has been updated. Use your new PIN for future logins.
                </p>
                <Button onClick={closeChangePinModal} className="mt-4">
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPin">Current PIN</Label>
                  <Input
                    id="currentPin"
                    type="password"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => {
                      setCurrentPinInput(e.target.value.replace(/\D/g, ""));
                      setPinChangeError(null);
                    }}
                    placeholder="••••"
                    className="text-center text-xl tracking-[0.5em]"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPin">New PIN</Label>
                  <Input
                    id="newPin"
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => {
                      setNewPinInput(e.target.value.replace(/\D/g, ""));
                      setPinChangeError(null);
                    }}
                    placeholder="••••"
                    className="text-center text-xl tracking-[0.5em]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirm New PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    maxLength={4}
                    value={confirmPinInput}
                    onChange={(e) => {
                      setConfirmPinInput(e.target.value.replace(/\D/g, ""));
                      setPinChangeError(null);
                    }}
                    placeholder="••••"
                    className="text-center text-xl tracking-[0.5em]"
                  />
                </div>

                {pinChangeError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {pinChangeError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={closeChangePinModal} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePinChange}
                    disabled={
                      isPinChangeLoading ||
                      currentPinInput.length !== 4 ||
                      newPinInput.length !== 4 ||
                      confirmPinInput.length !== 4
                    }
                    className="flex-1"
                  >
                    {isPinChangeLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change PIN"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Other Vehicle Modal */}
      <Dialog open={showOtherVehicleModal} onOpenChange={setShowOtherVehicleModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Select Other Vehicle
            </DialogTitle>
            <DialogDescription>
              Search and select a vehicle from the organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by plate, make or model..."
                value={otherVehicleSearch}
                onChange={(e) => setOtherVehicleSearch(e.target.value)}
                className="pl-10 h-12 text-lg"
                autoFocus
              />
            </div>

            {/* Vehicle list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoadingAllVehicles ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mb-2 opacity-50" />
                  <p>No vehicles available</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {allVehicles
                    .filter((vehicle) => {
                      return matchesSearch([vehicle.registration_plate, vehicle.make, vehicle.model], otherVehicleSearch);
                    })
                    .map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleSelectOtherVehicle(vehicle)}
                        className="flex items-center gap-3 rounded-lg border-2 border-transparent bg-muted/50 p-4 text-left transition-all hover:border-primary hover:bg-accent"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{vehicle.registration_plate}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {vehicle.make} {vehicle.model} • {vehicle.fuel_type.toUpperCase()}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize shrink-0 text-xs">
                          {vehicle.status.replace("_", " ")}
                        </Badge>
                      </button>
                    ))}
                  {/* No results */}
                  {otherVehicleSearch.trim() &&
                    allVehicles.filter((vehicle) => {
                      return matchesSearch([vehicle.registration_plate, vehicle.make, vehicle.model], otherVehicleSearch);
                    }).length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-50" />
                        <p>No vehicles match "{otherVehicleSearch}"</p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper component with Suspense for useSearchParams
export default function FuelPOSPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <FuelPOSPageContent />
    </Suspense>
  );
}
