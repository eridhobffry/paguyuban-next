import { InferSelectModel } from "drizzle-orm";
import { financialRevenueItems, financialCostItems } from "@/lib/db/schema";

export type FinancialRevenueItem = InferSelectModel<
  typeof financialRevenueItems
>;
export type FinancialCostItem = InferSelectModel<typeof financialCostItems>;

export interface FinancialResponseDto {
  revenues: FinancialRevenueItem[];
  costs: FinancialCostItem[];
}

// Shared upsert payload for both revenue and cost items
export type FinancialItemBase = Pick<
  FinancialRevenueItem,
  "category" | "amount" | "notes" | "sortOrder" | "evidenceUrl"
>;
