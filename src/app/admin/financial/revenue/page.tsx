"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin";
import { useFinancial } from "@/hooks/useFinancial";
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
import Link from "next/link";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function AdminFinancialRevenueDetailPage() {
  const { data, loading, error } = useFinancial();
  const [query, setQuery] = useState("");

  const filtered = (data?.revenues ?? []).filter((r) =>
    (r.category + (r.notes ?? "") + (r.evidenceUrl ?? ""))
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader />

        <div className="mb-4">
          <Link href="/admin/financial">
            <Button variant="outline">Back to Financial</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Revenue Details</CardTitle>
              <Input
                placeholder="Search..."
                className="w-full max-w-xs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="mb-2 text-sm text-muted-foreground">
              {filtered.length} items
            </div>
            <div className="overflow-auto rounded-md border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
