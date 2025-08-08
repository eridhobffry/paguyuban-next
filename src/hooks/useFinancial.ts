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

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/financial", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const json = (await res.json()) as FinancialResponse;
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createItem(
    itemType: "revenue" | "cost",
    item: Omit<FinancialItem, "id">
  ) {
    const res = await fetch("/api/admin/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemType, item }),
    });
    if (!res.ok) throw new Error("Create failed");
    await refresh();
    return res.json();
  }

  async function updateItem(
    itemType: "revenue" | "cost",
    id: string,
    item: Partial<FinancialItem>
  ) {
    const res = await fetch("/api/admin/financial", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemType, id, item }),
    });
    if (!res.ok) throw new Error("Update failed");
    await refresh();
    return res.json();
  }

  async function deleteItem(itemType: "revenue" | "cost", id: string) {
    const res = await fetch("/api/admin/financial", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemType, id }),
    });
    if (!res.ok) throw new Error("Delete failed");
    await refresh();
    return res.json();
  }

  const totalRevenue =
    data?.revenues?.reduce((s, r) => s + (r.amount || 0), 0) ?? 0;
  const totalCosts = data?.costs?.reduce((s, c) => s + (c.amount || 0), 0) ?? 0;
  const net = totalRevenue - totalCosts;

  return {
    data,
    loading,
    error,
    totalRevenue,
    totalCosts,
    net,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
