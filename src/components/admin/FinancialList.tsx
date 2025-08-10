"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

import type { FinancialListItem } from "@/types/financial";
export type BasicFinancialItem = FinancialListItem;

const euro = (amount: number) => formatCurrency(amount, true);

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
  disabled?: boolean;
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
    disabled,
  } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  const kindKey = props.kind; // "revenue" | "cost"
  const qp = useMemo(() => {
    const q = searchParams?.get(`${kindKey}_q`) ?? "";
    const limitStr = searchParams?.get(`${kindKey}_limit`) ?? "25";
    const sort =
      (searchParams?.get(`${kindKey}_sort`) as
        | "category"
        | "amount"
        | "sortOrder"
        | null) ?? null;
    const dir =
      (searchParams?.get(`${kindKey}_dir`) as "asc" | "desc" | null) ?? null;
    return { q, limitStr, sort, dir };
  }, [searchParams, kindKey]);

  const form = useForm<ToolbarForm>({
    resolver: zodResolver(ToolbarSchema),
    defaultValues: { query: qp.q, limit: Number(qp.limitStr) || 25 },
  });
  const query = (
    useWatch({ control: form.control, name: "query" }) ?? ""
  ).toString();
  const limit = Number(
    useWatch({ control: form.control, name: "limit" }) ?? 25
  );

  type SortBy = "category" | "amount" | "sortOrder";
  type SortDir = "asc" | "desc";
  const [sortBy, setSortBy] = useState<SortBy>(qp.sort ?? "sortOrder");
  const [sortDir, setSortDir] = useState<SortDir>(qp.dir ?? "asc");

  // keep form in sync if URL changes externally (e.g., back/forward)
  useEffect(() => {
    const nextQuery = qp.q;
    const nextLimit = Number(qp.limitStr) || 25;
    // only reset if different to avoid cursor jumps while typing
    const current = form.getValues();
    if (current.query !== nextQuery || Number(current.limit) !== nextLimit) {
      form.reset({ query: nextQuery, limit: nextLimit });
    }
    if ((qp.sort ?? "sortOrder") !== sortBy)
      setSortBy((qp.sort as SortBy) ?? "sortOrder");
    if ((qp.dir ?? "asc") !== sortDir) setSortDir((qp.dir as SortDir) ?? "asc");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qp.q, qp.limitStr, qp.sort, qp.dir]);

  // push URL updates when user changes toolbar
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set(`${kindKey}_q`, query);
    params.set(`${kindKey}_limit`, String(limit || 25));
    params.set(`${kindKey}_sort`, sortBy);
    params.set(`${kindKey}_dir`, sortDir);
    router.replace(`?${params.toString()}`);
  }, [query, limit, sortBy, sortDir, kindKey, router, searchParams]);

  function handleSort(next: SortBy) {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(next);
      setSortDir("asc");
    }
  }

  const filtered =
    items?.filter((it) =>
      (it.category + (it.notes ?? "") + (it.evidenceUrl ?? ""))
        .toLowerCase()
        .includes(query.toLowerCase())
    ) ?? [];
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "category") {
      return a.category.localeCompare(b.category) * dir;
    }
    if (sortBy === "amount") {
      return ((a.amount ?? 0) - (b.amount ?? 0)) * dir;
    }
    // sortOrder: place nulls at the end in asc, start in desc
    const aVal = a.sortOrder;
    const bVal = b.sortOrder;
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return dir; // null after in asc, before in desc
    if (bVal == null) return -dir;
    return (aVal - bVal) * dir;
  });
  const sliced = sorted.slice(0, limit === 0 ? undefined : limit);

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
            <Button size="sm" onClick={onAdd} disabled={disabled}>
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
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort("category")}
                  className="cursor-pointer select-none sticky top-0 bg-background"
                >
                  Category
                  {sortBy === "category"
                    ? sortDir === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("amount")}
                  className="cursor-pointer select-none text-right sticky top-0 bg-background"
                >
                  Amount
                  {sortBy === "amount" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("sortOrder")}
                  className="cursor-pointer select-none text-right sticky top-0 bg-background"
                >
                  Sort
                  {sortBy === "sortOrder"
                    ? sortDir === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </TableHead>
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
                    {euro(it.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {it.sortOrder ?? "-"}
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
            onClick={onView}
            disabled={disabled}
          >
            View
          </Button>
          <Button disabled={!selectedId || disabled} size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            disabled={!selectedId || disabled}
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
