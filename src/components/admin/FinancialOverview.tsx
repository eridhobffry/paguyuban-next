"use client";

import { useFinancial } from "@/hooks/useFinancial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FinancialItemBase } from "@/types/financial";
import { formatCurrency } from "@/lib/utils";
import { FinancialItemDialog } from "@/components/admin/FinancialItemDialog";
import { FinancialList } from "@/components/admin/FinancialList";

const euro = (amount: number) => formatCurrency(amount, true);

export function FinancialOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // hydrate selection from URL on mount or URL changes
  const selectedFromUrl = useMemo(() => {
    const rev = searchParams?.get("revenue_selected");
    const cost = searchParams?.get("cost_selected");
    if (rev) return { id: rev, type: "revenue" as const };
    if (cost) return { id: cost, type: "cost" as const };
    return null;
  }, [searchParams]);
  const {
    data,
    loading,
    error,
    totalRevenue,
    totalCosts,
    net,
    createItem,
    updateItem,
    deleteItem,
    isMutating,
  } = useFinancial();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"revenue" | "cost" | null>(
    null
  );

  useEffect(() => {
    if (selectedFromUrl) {
      setSelectedId(selectedFromUrl.id);
      setSelectedType(selectedFromUrl.type);
    }
  }, [selectedFromUrl]);

  function updateSelectionInUrl(kind: "revenue" | "cost", id: string | null) {
    const params = new URLSearchParams(searchParams?.toString());
    if (kind === "revenue") {
      if (id) params.set("revenue_selected", id);
      else params.delete("revenue_selected");
      // keep cost selection intact
    } else {
      if (id) params.set("cost_selected", id);
      else params.delete("cost_selected");
    }
    router.replace(`?${params.toString()}`);
  }
  const [modal, setModal] = useState<null | "add" | "edit" | "view">(null);
  const [form, setForm] = useState<FinancialItemBase>({
    category: "",
    amount: 0,
    notes: "",
    evidenceUrl: "",
    sortOrder: null,
  });
  // Toolbar state handled inside FinancialList

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {euro(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {euro(totalCosts)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                net >= 0 ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {net >= 0 ? "+" : ""}
              {euro(Math.abs(net))}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <Badge variant="secondary">Loading...</Badge>}
      {error && <Badge variant="destructive">{error}</Badge>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinancialList
          title="Revenues"
          kind="revenue"
          items={data?.revenues ?? []}
          selectedId={selectedId}
          disabled={isMutating}
          onAdd={() => {
            setSelectedType("revenue");
            setForm({
              category: "",
              amount: 0,
              notes: "",
              evidenceUrl: "",
              sortOrder: null,
            });
            setModal("add");
          }}
          onSelect={(r) => {
            setSelectedId(r.id);
            setSelectedType("revenue");
            updateSelectionInUrl("revenue", r.id);
            setForm({
              category: r.category,
              amount: r.amount,
              notes: r.notes ?? "",
              evidenceUrl: r.evidenceUrl ?? "",
              sortOrder: r.sortOrder ?? null,
            });
          }}
          onView={() => {
            if (selectedId) {
              router.push(`/admin/financial/revenue/${selectedId}`);
            } else {
              router.push("/admin/financial/revenue");
            }
          }}
          onEdit={() => setModal("edit")}
          onDelete={async () => {
            if (selectedId && confirm("Delete this item?")) {
              await deleteItem("revenue", selectedId);
              setSelectedId(null);
            }
          }}
        />
        <FinancialList
          title="Costs"
          kind="cost"
          items={data?.costs ?? []}
          selectedId={selectedId}
          disabled={isMutating}
          onAdd={() => {
            setSelectedType("cost");
            setForm({
              category: "",
              amount: 0,
              notes: "",
              evidenceUrl: "",
              sortOrder: null,
            });
            setModal("add");
          }}
          onSelect={(c) => {
            setSelectedId(c.id);
            setSelectedType("cost");
            updateSelectionInUrl("cost", c.id);
            setForm({
              category: c.category,
              amount: c.amount,
              notes: c.notes ?? "",
              evidenceUrl: c.evidenceUrl ?? "",
              sortOrder: c.sortOrder ?? null,
            });
          }}
          onView={() => {
            if (selectedId) {
              router.push(`/admin/financial/cost/${selectedId}`);
            } else {
              router.push("/admin/financial/cost");
            }
          }}
          onEdit={() => setModal("edit")}
          onDelete={async () => {
            if (selectedId && confirm("Delete this item?")) {
              await deleteItem("cost", selectedId);
              setSelectedId(null);
            }
          }}
        />
      </div>

      <FinancialItemDialog
        open={modal !== null}
        mode={modal ?? "view"}
        type={selectedType ?? "revenue"}
        defaultValues={form}
        onOpenChange={(o: boolean) => {
          if (!o) setModal(null);
        }}
        onSave={async (values: FinancialItemBase) => {
          if (!selectedType) return;
          if (modal === "add") {
            await createItem(selectedType, values);
          } else if (modal === "edit" && selectedId) {
            await updateItem(selectedType, selectedId, values);
          }
          setModal(null);
        }}
      />
    </div>
  );
}
