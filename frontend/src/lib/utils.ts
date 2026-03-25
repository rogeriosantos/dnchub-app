import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: string = "en-US",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(dateObj);
}

export function formatDistance(value: number, unit: "km" | "mi" = "km"): string {
  const suffix = unit === "km" ? "km" : "mi";
  return `${formatNumber(value, "en-US", { maximumFractionDigits: 1 })} ${suffix}`;
}

export function formatDateTime(
  date: Date | string,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  // Use fixed locale and options to avoid hydration mismatch
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatFuelEfficiency(
  value: number,
  format: "km/l" | "l/100km" | "mpg" = "km/l"
): string {
  switch (format) {
    case "km/l":
      return `${value.toFixed(2)} km/L`;
    case "l/100km":
      return `${value.toFixed(2)} L/100km`;
    case "mpg":
      return `${value.toFixed(2)} MPG`;
    default:
      return `${value.toFixed(2)}`;
  }
}

export function formatFuelVolume(value: number, unit: "l" | "gal" = "l"): string {
  const suffix = unit === "l" ? "L" : "gal";
  return `${formatNumber(value, "en-US", { maximumFractionDigits: 2 })} ${suffix}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Normalize a string for accent-insensitive, case-insensitive matching.
 */
function normalizeStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Match a search query against a list of fields.
 * Supports multi-term AND search using `+` as separator.
 * Example: "fanuc+sinais" matches records containing BOTH "fanuc" AND "sinais".
 * All matching is accent-insensitive and case-insensitive.
 */
export function matchesSearch(fields: (string | null | undefined)[], query: string): boolean {
  if (!query.trim()) return true;
  const terms = query.split('+').map((t) => t.trim()).filter(Boolean);
  const haystack = fields.map((f) => normalizeStr(f ?? '')).join(' ');
  return terms.every((term) => haystack.includes(normalizeStr(term)));
}

export function getDaysUntil(date: Date | string): number {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date | string): boolean {
  return getDaysUntil(date) < 0;
}

export function isDueSoon(date: Date | string, days: number = 7): boolean {
  const daysUntil = getDaysUntil(date);
  return daysUntil >= 0 && daysUntil <= days;
}
