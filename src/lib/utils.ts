import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
