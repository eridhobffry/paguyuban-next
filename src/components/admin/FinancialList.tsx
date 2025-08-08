"use client";

import { z } from "zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BasicFinancialItem = {
  id: string;
  category: string;
  amount: number;
  notes: string | null;
  evidenceUrl: string | null;
  sortOrder: number | null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const ToolbarSchema = z.object({
  query: z.string(),
  limit: z.number(),
});
type ToolbarForm = z.infer<typeof ToolbarSchema>;

export function FinancialList(props: {
  title: string;
  kind: "revenue" | "cost";
  items: BasicFinancialItem[];
  selectedId: string | null;
  onAdd: () => void;
  onSelect: (item: BasicFinancialItem) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const {
    title,
    items,
    selectedId,
    onAdd,
    onSelect,
    onView,
    onEdit,
    onDelete,
  } = props;

  const form = useForm<ToolbarForm>({
    resolver: zodResolver(ToolbarSchema),
    defaultValues: { query: "", limit: 25 },
  });
  const query = (
    useWatch({ control: form.control, name: "query" }) ?? ""
  ).toString();
  const limit = Number(
    useWatch({ control: form.control, name: "limit" }) ?? 25
  );

  const filtered =
    items?.filter((it) =>
      (it.category + (it.notes ?? "") + (it.evidenceUrl ?? ""))
        .toLowerCase()
        .includes(query.toLowerCase())
    ) ?? [];
  const sliced = filtered.slice(0, limit === 0 ? undefined : limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <form
              className="flex w-full items-center gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                placeholder="Search..."
                className="w-full md:w-64"
                {...form.register("query")}
              />
              <Controller
                control={form.control}
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
            <Button size="sm" onClick={onAdd}>
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-muted-foreground">
          {items?.length ?? 0} items
        </div>
        <div className="max-h-80 overflow-auto rounded-md border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sliced.map((it) => (
                <TableRow
                  key={it.id}
                  data-state={selectedId === it.id ? "selected" : undefined}
                  onClick={() => onSelect(it)}
                  className="cursor-pointer"
                >
                  <TableCell>{it.category}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(it.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={onView}>
            View
          </Button>
          <Button disabled={!selectedId} size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            disabled={!selectedId}
            size="sm"
            variant="destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialList;
