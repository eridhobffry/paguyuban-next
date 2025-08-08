import { useEffect, useState } from "react";

export type FinancialItem = {
  id: string;
  category: string;
  amount: number;
  notes?: string | null;
  sortOrder?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FinancialResponse = {
  revenues: FinancialItem[];
  costs: FinancialItem[];
};

export function useFinancial() {
  const [data, setData] = useState<FinancialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/financial", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const json = (await res.json()) as FinancialResponse;
        if (isMounted) setData(json);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? "Unknown error");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalRevenue =
    data?.revenues?.reduce((s, r) => s + (r.amount || 0), 0) ?? 0;
  const totalCosts = data?.costs?.reduce((s, c) => s + (c.amount || 0), 0) ?? 0;
  const net = totalRevenue - totalCosts;

  return { data, loading, error, totalRevenue, totalCosts, net };
}
