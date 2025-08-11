"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FinancialItemBase } from "@/types/financial";

const itemSchema = z
  .object({
    category: z.string().min(1, "Required"),
    amount: z.coerce.number(),
    notes: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v ?? null)),
    evidenceUrl: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v ?? null)),
    sortOrder: z
      .union([z.coerce.number(), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : Number(v)))
      .nullable(),
  })
  .transform(
    (v) =>
      ({
        category: v.category,
        amount: v.amount,
        notes: v.notes ?? null,
        evidenceUrl: v.evidenceUrl ?? null,
        sortOrder: v.sortOrder ?? null,
      } satisfies FinancialItemBase)
  );

export type FinancialItemFormInput = z.input<typeof itemSchema>;
export type FinancialItemForm = z.output<typeof itemSchema>;

export function FinancialItemDialog(props: {
  open: boolean;
  mode: "add" | "edit" | "view";
  type: "revenue" | "cost";
  defaultValues: FinancialItemBase;
  onOpenChange?: (open: boolean) => void;
  onSave?: (values: FinancialItemBase) => Promise<void> | void;
}) {
  const { open, mode, type, defaultValues, onOpenChange, onSave } = props;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FinancialItemFormInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues as unknown as FinancialItemFormInput,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues as unknown as FinancialItemFormInput);
    }
  }, [open, defaultValues, reset]);

  async function onSubmit(values: FinancialItemFormInput) {
    const parsed = itemSchema.parse(values) as FinancialItemBase;
    await onSave?.(parsed);
  }

  const disabled = mode === "view";
  const title = `${
    mode === "add" ? "Add" : mode === "edit" ? "Edit" : "Details"
  } ${type === "revenue" ? "Revenue" : "Cost"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="Category"
            disabled={disabled}
            {...register("category")}
          />
          <Input
            placeholder="Amount"
            type="number"
            step="1"
            disabled={disabled}
            {...register("amount", { valueAsNumber: true })}
          />
          <Input
            placeholder="Notes (optional)"
            disabled={disabled}
            {...register("notes")}
          />
          <Input
            placeholder="Evidence URL (optional)"
            disabled={disabled}
            {...register("evidenceUrl")}
          />
          <Input
            placeholder="Sort (optional)"
            type="number"
            disabled={disabled}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </div>
        {mode !== "view" && (
          <DialogFooter>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FinancialItemDialog;
