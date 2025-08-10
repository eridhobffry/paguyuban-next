import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FinancialItemBase, FinancialResponseDto } from "@/types/financial";

export function useFinancial() {
  const [data, setData] = useState<FinancialResponseDto | null>(null);
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
    try {
      const res = await fetch("/api/admin/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, item }),
      });
      if (!res.ok) throw new Error("Create failed");
      await refresh();
      window.dispatchEvent(new CustomEvent("financial-updated"));
      toast.success("Created");
      return res.json();
    } catch (e) {
      toast.error("Create failed");
      throw e;
    }
  }

  async function updateItem(
    itemType: "revenue" | "cost",
    id: string,
    item: Partial<FinancialItemBase>
  ) {
    try {
      const res = await fetch("/api/admin/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, id, item }),
      });
      if (!res.ok) throw new Error("Update failed");
      await refresh();
      window.dispatchEvent(new CustomEvent("financial-updated"));
      toast.success("Updated");
      return res.json();
    } catch (e) {
      toast.error("Update failed");
      throw e;
    }
  }

  async function deleteItem(itemType: "revenue" | "cost", id: string) {
    try {
      const res = await fetch("/api/admin/financial", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await refresh();
      window.dispatchEvent(new CustomEvent("financial-updated"));
      toast.success("Deleted");
      return res.json();
    } catch (e) {
      toast.error("Delete failed");
      throw e;
    }
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
