"use client";

import { useFinancial } from "@/hooks/useFinancial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function FinancialOverview() {
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
  const [form, setForm] = useState({
    category: "",
    amount: 0,
    notes: "",
    sortOrder: undefined as number | undefined,
  });

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
            <div className="flex items-center justify-between">
              <CardTitle>Revenues</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedType("revenue");
                  setForm({
                    category: "",
                    amount: 0,
                    notes: "",
                    sortOrder: undefined,
                  });
                  setModal("add");
                }}
              >
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Selection table with actions */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.revenues?.map((r) => (
                  <TableRow
                    key={r.id}
                    data-state={selectedId === r.id ? "selected" : undefined}
                    onClick={() => {
                      setSelectedId(r.id);
                      setSelectedType("revenue");
                      setForm({
                        category: r.category,
                        amount: r.amount,
                        notes: r.notes ?? "",
                        sortOrder: r.sortOrder ?? undefined,
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
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedId || selectedType !== "revenue"}
                onClick={() => setModal("view")}
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
            <div className="flex items-center justify-between">
              <CardTitle>Costs</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedType("cost");
                  setForm({
                    category: "",
                    amount: 0,
                    notes: "",
                    sortOrder: undefined,
                  });
                  setModal("add");
                }}
              >
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.costs?.map((c) => (
                  <TableRow
                    key={c.id}
                    data-state={selectedId === c.id ? "selected" : undefined}
                    onClick={() => {
                      setSelectedId(c.id);
                      setSelectedType("cost");
                      setForm({
                        category: c.category,
                        amount: c.amount,
                        notes: c.notes ?? "",
                        sortOrder: c.sortOrder ?? undefined,
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
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedId || selectedType !== "cost"}
                onClick={() => setModal("view")}
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

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal === "add" ? "Add" : modal === "edit" ? "Edit" : "Details"}{" "}
              {selectedType === "revenue" ? "Revenue" : "Cost"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              disabled={modal === "view"}
            />
            <Input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              disabled={modal === "view"}
            />
            <Input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={modal === "view"}
            />
            <Input
              placeholder="Sort"
              type="number"
              value={form.sortOrder ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  sortOrder: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              disabled={modal === "view"}
            />
          </div>
          {modal !== "view" && (
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!selectedType) return;
                  if (modal === "add") {
                    await createItem(selectedType, {
                      category: form.category,
                      amount: form.amount,
                      notes: form.notes ?? null,
                      sortOrder: form.sortOrder ?? undefined,
                    } as { category: string; amount: number; notes: string | null; sortOrder?: number | undefined });
                  } else if (modal === "edit" && selectedId) {
                    await updateItem(selectedType, selectedId, {
                      category: form.category,
                      amount: form.amount,
                      notes: form.notes ?? null,
                      sortOrder: form.sortOrder ?? undefined,
                    });
                  }
                  setModal(null);
                }}
              >
                Save
              </Button>
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
