"use client";

import { useFinancial } from "@/hooks/useFinancial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinancialItemBase } from "@/types/financial";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinancialItemDialog } from "@/components/admin/FinancialItemDialog";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function FinancialOverview() {
  const router = useRouter();
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
  } = useFinancial();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"revenue" | "cost" | null>(
    null
  );
  const [modal, setModal] = useState<null | "add" | "edit" | "view">(null);
  const [form, setForm] = useState<FinancialItemBase>({
    category: "",
    amount: 0,
    notes: "",
    evidenceUrl: "",
    sortOrder: null,
  });
  const ToolbarSchema = z.object({
    query: z.string(),
    limit: z.number(),
  });
  type ToolbarForm = z.infer<typeof ToolbarSchema>;
  const revenueForm = useForm<ToolbarForm>({
    resolver: zodResolver(ToolbarSchema),
    defaultValues: { query: "", limit: 25 },
  });
  const costForm = useForm<ToolbarForm>({
    resolver: zodResolver(ToolbarSchema),
    defaultValues: { query: "", limit: 25 },
  });
  const revenueQuery = (
    useWatch({ control: revenueForm.control, name: "query" }) ?? ""
  ).toString();
  const costQuery = (
    useWatch({ control: costForm.control, name: "query" }) ?? ""
  ).toString();
  const revenueLimit = Number(
    useWatch({ control: revenueForm.control, name: "limit" }) ?? 25
  );
  const costLimit = Number(
    useWatch({ control: costForm.control, name: "limit" }) ?? 25
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalCosts)}
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
              {formatCurrency(Math.abs(net))}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <Badge variant="secondary">Loading...</Badge>}
      {error && <Badge variant="destructive">{error}</Badge>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Revenues</CardTitle>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <form
                  className="flex w-full items-center gap-2"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Input
                    placeholder="Search..."
                    className="w-full md:w-64"
                    {...revenueForm.register("query")}
                  />
                  <Controller
                    control={revenueForm.control}
                    name="limit"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        value={String(value ?? 25)}
                        onValueChange={(v) => onChange(Number(v))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Rows" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="0">All</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </form>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedType("revenue");
                    setForm({
                      category: "",
                      amount: 0,
                      notes: "",
                      sortOrder: null,
                      evidenceUrl: "",
                    });
                    setModal("add");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-sm text-muted-foreground">
              {data?.revenues?.length ?? 0} items
            </div>
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table id="revenue-table" className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.revenues
                    ?.filter((r) =>
                      (r.category + (r.notes ?? "") + (r.evidenceUrl ?? ""))
                        .toLowerCase()
                        .includes(revenueQuery.toLowerCase())
                    )
                    .slice(0, revenueLimit === 0 ? undefined : revenueLimit)
                    .map((r) => (
                      <TableRow
                        key={r.id}
                        data-state={
                          selectedId === r.id ? "selected" : undefined
                        }
                        onClick={() => {
                          setSelectedId(r.id);
                          setSelectedType("revenue");
                          setForm({
                            category: r.category,
                            amount: r.amount,
                            notes: r.notes ?? "",
                            evidenceUrl: r.evidenceUrl ?? "",
                            sortOrder: r.sortOrder ?? null,
                          });
                        }}
                        className="cursor-pointer"
                      >
                        <TableCell>{r.category}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(r.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/admin/financial/revenue")}
              >
                View
              </Button>
              <Button
                size="sm"
                disabled={!selectedId || selectedType !== "revenue"}
                onClick={() => setModal("edit")}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!selectedId || selectedType !== "revenue"}
                onClick={async () => {
                  if (selectedId && confirm("Delete this item?")) {
                    await deleteItem("revenue", selectedId);
                    setSelectedId(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Costs</CardTitle>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <form
                  className="flex w-full items-center gap-2"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Input
                    placeholder="Search..."
                    className="w-full md:w-64"
                    {...costForm.register("query")}
                  />
                  <Controller
                    control={costForm.control}
                    name="limit"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        value={String(value ?? 25)}
                        onValueChange={(v) => onChange(Number(v))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Rows" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="0">All</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </form>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedType("cost");
                    setForm({
                      category: "",
                      amount: 0,
                      notes: "",
                      sortOrder: null,
                      evidenceUrl: "",
                    });
                    setModal("add");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-sm text-muted-foreground">
              {data?.costs?.length ?? 0} items
            </div>
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table id="cost-table" className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.costs
                    ?.filter((c) =>
                      (c.category + (c.notes ?? "") + (c.evidenceUrl ?? ""))
                        .toLowerCase()
                        .includes(costQuery.toLowerCase())
                    )
                    .slice(0, costLimit === 0 ? undefined : costLimit)
                    .map((c) => (
                      <TableRow
                        key={c.id}
                        data-state={
                          selectedId === c.id ? "selected" : undefined
                        }
                        onClick={() => {
                          setSelectedId(c.id);
                          setSelectedType("cost");
                          setForm({
                            category: c.category,
                            amount: c.amount,
                            notes: c.notes ?? "",
                            evidenceUrl: c.evidenceUrl ?? "",
                            sortOrder: c.sortOrder ?? null,
                          });
                        }}
                        className="cursor-pointer"
                      >
                        <TableCell>{c.category}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(c.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/admin/financial/cost")}
              >
                View
              </Button>
              <Button
                size="sm"
                disabled={!selectedId || selectedType !== "cost"}
                onClick={() => setModal("edit")}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!selectedId || selectedType !== "cost"}
                onClick={async () => {
                  if (selectedId && confirm("Delete this item?")) {
                    await deleteItem("cost", selectedId);
                    setSelectedId(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
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
