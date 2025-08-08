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
