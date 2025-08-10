import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FinancialResponseDto } from "@/types/financial";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe currency formatting to avoid hydration mismatches
export function formatCurrency(amount: number, isClient: boolean = false) {
  if (!isClient) {
    return `€${amount.toLocaleString("en-US")}`;
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date value into a human-readable string.
 *
 * Guidelines:
 * - Pass `isClient: true` when calling from Client Components to use the user's timezone/locale.
 * - When rendering on the server, the function defaults to a stable timezone (UTC)
 *   to minimize hydration mismatches.
 *
 * @param value The date to format. Accepts Date, timestamp, or ISO/date string.
 * @param options.includeTime Whether to include time (HH:MM). Default: true.
 * @param options.locale BCP 47 locale string. Default: "de-DE".
 * @param options.timeZone IANA timezone name. Default: undefined on client, "UTC" on server.
 * @param options.isClient Set true in Client Components to use client defaults. Default: false.
 * @returns A formatted date string, or "-" when value is null/undefined/invalid.
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  options?: {
    includeTime?: boolean;
    locale?: string;
    timeZone?: string;
    isClient?: boolean;
  }
): string {
  if (value === null || value === undefined) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const includeTime = options?.includeTime ?? true;
  const locale = options?.locale ?? "de-DE";
  const isClient = options?.isClient ?? false;
  const timeZone = isClient ? options?.timeZone : options?.timeZone ?? "UTC";

  const base: Intl.DateTimeFormatOptions = includeTime
    ? {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    : { year: "numeric", month: "short", day: "2-digit" };

  return new Intl.DateTimeFormat(locale, { ...base, timeZone }).format(date);
}

/**
 * Fetch public financial data with optional cache-busting to bypass CDN.
 */
export async function fetchPublicFinancial(options?: { bust?: boolean }) {
  const bust = options?.bust ?? true;
  const url = `/api/financial/public${bust ? `?v=${Date.now()}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load financial data");
  return (await res.json()) as FinancialResponseDto;
}
