"use client";

import { useFinancial } from "@/hooks/useFinancial";
import type { FinancialItemBase } from "@/types/financial";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

const itemSchema = z
  .object({
    category: z.string().min(1, "Required"),
    amount: z.coerce.number(),
    notes: z.string().nullable().optional(),
    sortOrder: z.coerce.number().nullable().optional(),
  })
  .transform(
    (v) =>
      ({
        category: v.category,
        amount: v.amount,
        notes: v.notes ?? null,
        sortOrder: v.sortOrder ?? null,
      } satisfies FinancialItemBase)
  );

type ItemFormInput = z.input<typeof itemSchema>;
type ItemForm = z.output<typeof itemSchema>;

function Editor({ kind }: { kind: "revenue" | "cost" }) {
  const { data, createItem, updateItem, deleteItem } = useFinancial();
  const items = kind === "revenue" ? data?.revenues ?? [] : data?.costs ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: { category: "", amount: 0 },
  });

  async function onCreate(values: ItemFormInput) {
    const parsed = itemSchema.parse(values);
    await createItem(kind, parsed as FinancialItemBase);
    toast.success(`${kind === "revenue" ? "Revenue" : "Cost"} added`);
    reset({ category: "", amount: 0, notes: "", sortOrder: undefined });
  }

  async function onUpdate(id: string, values: ItemFormInput) {
    const parsed = itemSchema.parse(values);
    await updateItem(kind, id, parsed as Partial<FinancialItemBase>);
    toast.success("Saved");
    setEditingId(null);
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {kind === "revenue" ? "Revenues" : "Costs"} Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={handleSubmit((vals) => onCreate(vals as ItemForm))}
        >
          <Input placeholder="Category" {...register("category")} />
          <Input placeholder="Amount" {...register("amount")} />
          <Input placeholder="Notes (optional)" {...register("notes")} />
          <Input placeholder="Sort (optional)" {...register("sortOrder")} />
          <Button type="submit" disabled={isSubmitting}>
            Add
          </Button>
          {errors.category && (
            <span className="text-xs text-red-500">
              {errors.category.message}
            </span>
          )}
          {errors.amount && (
            <span className="text-xs text-red-500">
              {errors.amount.message}
            </span>
          )}
        </form>

        <Toaster />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  {editingId === it.id ? (
                    <Input
                      defaultValue={it.category}
                      {...register("category")}
                    />
                  ) : (
                    it.category
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === it.id ? (
                    <Input
                      defaultValue={String(it.amount)}
                      type="number"
                      step="1"
                      {...register("amount", { valueAsNumber: true })}
                    />
                  ) : (
                    new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(it.amount)
                  )}
                </TableCell>
                <TableCell>
                  {editingId === it.id ? (
                    <Input
                      defaultValue={it.notes ?? ""}
                      {...register("notes")}
                    />
                  ) : (
                    it.notes ?? "—"
                  )}
                </TableCell>
                <TableCell className="space-x-2">
                  {editingId === it.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSubmit((vals) =>
                          onUpdate(it.id, vals as ItemForm)
                        )}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(it.id);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (confirm("Delete this item?")) {
                            await deleteItem(kind, it.id);
                            toast.success("Deleted");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit {kind === "revenue" ? "Revenue" : "Cost"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input placeholder="Category" {...register("category")} />
              <Input
                placeholder="Amount"
                type="number"
                step="1"
                {...register("amount", { valueAsNumber: true })}
              />
              <Input placeholder="Notes (optional)" {...register("notes")} />
              <Input
                placeholder="Sort (optional)"
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit((vals) => onUpdate(editingId!, vals))}
                disabled={isSubmitting}
              >
                Save
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function FinancialEditor() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Editor kind="revenue" />
      <Editor kind="cost" />
    </div>
  );
}
