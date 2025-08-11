import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FinancialCostItem,
  FinancialItemBase,
  FinancialResponseDto,
  FinancialRevenueItem,
} from "@/types/financial";
import { computeTotals } from "@/lib/financial";

export function useFinancial() {
  const [data, setData] = useState<FinancialResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/financial", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const json = (await res.json()) as FinancialResponseDto;
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const onUpdated = () => refresh();
    window.addEventListener("financial-updated", onUpdated);
    return () => window.removeEventListener("financial-updated", onUpdated);
  }, []);

  async function createItem(
    itemType: "revenue" | "cost",
    item: FinancialItemBase
  ) {
    setIsMutating(true);
    // Optimistic create with temporary ID
    const previous = data;
    const tempId = (globalThis.crypto?.randomUUID?.() ??
      Math.random().toString(36).slice(2)) as string;
    if (data) {
      const optimisticItem = {
        id: tempId,
        category: item.category,
        amount: item.amount,
        notes: item.notes ?? null,
        evidenceUrl: item.evidenceUrl ?? null,
        sortOrder: item.sortOrder ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as FinancialRevenueItem & FinancialCostItem;
      const next: FinancialResponseDto = {
        revenues:
          itemType === "revenue"
            ? [optimisticItem as FinancialRevenueItem, ...data.revenues]
            : data.revenues,
        costs:
          itemType === "cost"
            ? [optimisticItem as FinancialCostItem, ...data.costs]
            : data.costs,
      };
      setData(next);
    }
    try {
      const res = await fetch("/api/admin/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, item }),
      });
      if (!res.ok) throw new Error("Create failed");
      const json = (await res.json()) as {
        item: FinancialRevenueItem | FinancialCostItem;
      };
      // Reconcile temp ID with server item
      if (data) {
        setData((curr) => {
          if (!curr) return curr;
          if (itemType === "revenue") {
            const replaced = curr.revenues.map((r) =>
              r.id === tempId ? (json.item as FinancialRevenueItem) : r
            );
            return { ...curr, revenues: replaced };
          } else {
            const replaced = curr.costs.map((c) =>
              c.id === tempId ? (json.item as FinancialCostItem) : c
            );
            return { ...curr, costs: replaced };
          }
        });
      }
      window.dispatchEvent(new CustomEvent("financial-updated"));
      try {
        const bc = new BroadcastChannel("financial");
        bc.postMessage({ type: "updated" });
        bc.close();
      } catch {}
      toast.success("Created");
      return json;
    } catch (e) {
      // Revert on failure
      if (previous) setData(previous);
      toast.error("Create failed");
      throw e;
    } finally {
      setIsMutating(false);
    }
  }

  async function getItem(
    itemType: "revenue" | "cost",
    id: string
  ): Promise<FinancialRevenueItem | FinancialCostItem> {
    const res = await fetch(
      `/api/admin/financial/item?id=${encodeURIComponent(
        id
      )}&itemType=${itemType}`,
      {
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error("Fetch item failed");
    const json = (await res.json()) as {
      item: FinancialRevenueItem | FinancialCostItem;
    };
    return json.item;
  }

  async function updateItem(
    itemType: "revenue" | "cost",
    id: string,
    item: Partial<FinancialItemBase>
  ) {
    setIsMutating(true);
    // Optimistic update
    const previous = data;
    if (data) {
      const next: FinancialResponseDto = {
        revenues:
          itemType === "revenue"
            ? data.revenues.map((r) => (r.id === id ? { ...r, ...item } : r))
            : data.revenues,
        costs:
          itemType === "cost"
            ? data.costs.map((c) => (c.id === id ? { ...c, ...item } : c))
            : data.costs,
      };
      setData(next);
    }
    try {
      const res = await fetch("/api/admin/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, id, item }),
      });
      if (!res.ok) throw new Error("Update failed");
      window.dispatchEvent(new CustomEvent("financial-updated"));
      try {
        const bc = new BroadcastChannel("financial");
        bc.postMessage({ type: "updated" });
        bc.close();
      } catch {}
      toast.success("Updated");
      return res.json();
    } catch (e) {
      // Revert on failure
      if (previous) setData(previous);
      toast.error("Update failed");
      throw e;
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteItem(itemType: "revenue" | "cost", id: string) {
    setIsMutating(true);
    // Optimistic update
    const previous = data;
    if (data) {
      const next: FinancialResponseDto = {
        revenues:
          itemType === "revenue"
            ? data.revenues.filter((r) => r.id !== id)
            : data.revenues,
        costs:
          itemType === "cost"
            ? data.costs.filter((c) => c.id !== id)
            : data.costs,
      };
      setData(next);
    }
    try {
      const res = await fetch("/api/admin/financial", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      window.dispatchEvent(new CustomEvent("financial-updated"));
      try {
        const bc = new BroadcastChannel("financial");
        bc.postMessage({ type: "updated" });
        bc.close();
      } catch {}
      toast.success("Deleted");
      return res.json();
    } catch (e) {
      // Revert on failure
      if (previous) setData(previous);
      toast.error("Delete failed");
      throw e;
    } finally {
      setIsMutating(false);
    }
  }

  const totals = useMemo(() => computeTotals(data), [data]);

  return {
    data,
    loading,
    error,
    totalRevenue: totals.totalRevenue,
    totalCosts: totals.totalCosts,
    net: totals.net,
    refresh,
    getItem,
    isMutating,
    createItem,
    updateItem,
    deleteItem,
  };
}
