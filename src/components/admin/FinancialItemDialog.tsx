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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

  const form = useForm<FinancialItemFormInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues as unknown as FinancialItemFormInput,
  });
  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = form;

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
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Category"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Amount"
                        type="number"
                        step="1"
                        disabled={disabled}
                        value={
                          typeof field.value === "number" ? field.value : ""
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Notes (optional)"
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evidenceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Evidence URL (optional)"
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sort (optional)"
                        type="number"
                        disabled={disabled}
                        value={
                          typeof field.value === "number" ? field.value : ""
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {mode !== "view" && (
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange?.(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default FinancialItemDialog;
