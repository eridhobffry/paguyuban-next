import type { FinancialResponseDto } from "@/types/financial";

export function computeTotals(financial: FinancialResponseDto | null) {
  const totalRevenue = (financial?.revenues ?? []).reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  const totalCosts = (financial?.costs ?? []).reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );
  const net = totalRevenue - totalCosts;
  return { totalRevenue, totalCosts, net };
}
