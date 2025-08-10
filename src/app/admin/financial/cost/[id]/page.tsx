"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FinancialCostItem } from "@/types/financial";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CostItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<FinancialCostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/financial/item?id=${id}&itemType=cost`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = (await res.json()) as { item: FinancialCostItem };
        setItem(json.item);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/financial">Back</Link>
        </Button>
        <Button variant="secondary" onClick={() => router.refresh()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && item && (
            <div className="space-y-2">
              <Row label="Category" value={item.category} />
              <Row label="Amount" value={formatCurrency(item.amount, true)} />
              <Row label="Notes" value={item.notes ?? "-"} />
              <Row
                label="Evidence"
                value={
                  item.evidenceUrl ? (
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.evidenceUrl}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <Row label="Sort Order" value={item.sortOrder ?? "-"} />
              <Row
                label="Created"
                value={formatDate(item.createdAt, { isClient: true })}
              />
              <Row
                label="Updated"
                value={formatDate(item.updatedAt, { isClient: true })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-1 text-sm text-muted-foreground">
        {props.label}
      </div>
      <div className="col-span-2">{props.value}</div>
    </div>
  );
}
