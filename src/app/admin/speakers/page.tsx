"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSpeakersAdmin } from "@/hooks/useSpeakers";
import { SpeakersDialog } from "@/components/admin/SpeakersDialog";
import type { Speaker } from "@/types/people";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SpeakersAdminPage() {
  const {
    speakers,
    loading,
    error,
    fetchSpeakers,
    createSpeaker,
    updateSpeaker,
    deleteSpeaker,
  } = useSpeakersAdmin();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<number>(25);
  const [filterType, setFilterType] = useState<string>("");
  const [filterCompany, setFilterCompany] = useState<string>("");
  type SortBy = "name" | "role" | "company" | "speakerType";
  type SortDir = "asc" | "desc";
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const selected = useMemo(
    () => speakers.find((s) => s.id === selectedId) ?? null,
    [speakers, selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return speakers
      .filter((s) =>
        (s.name + (s.role ?? "") + (s.company ?? "") + (s.speakerType ?? ""))
          .toLowerCase()
          .includes(q)
      )
      .filter((s) =>
        filterType ? (s.speakerType ?? "").toLowerCase() === filterType : true
      )
      .filter((s) =>
        filterCompany
          ? (s.company ?? "")
              .toLowerCase()
              .includes(filterCompany.toLowerCase())
          : true
      );
  }, [speakers, query, filterType, filterCompany]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortBy] ?? "") as string;
      const bVal = (b[sortBy] ?? "") as string;
      return aVal.localeCompare(bVal) * dir;
    });
  }, [filtered, sortBy, sortDir]);

  const sliced = useMemo(
    () => sorted.slice(0, limit === 0 ? undefined : limit),
    [sorted, limit]
  );

  function handleSort(next: SortBy) {
    if (sortBy === next) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(next);
      setSortDir("asc");
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Speakers</h1>
          <p className="text-muted-foreground">Read-only list (initial cut).</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search..."
            className="w-64 hidden md:block"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="summit">Summit</SelectItem>
              <SelectItem value="main_stage">Main Stage</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by company"
            className="w-56 hidden md:block"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          />
          <Select
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
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
          <Button
            variant="outline"
            onClick={() => fetchSpeakers()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedId(null);
              setOpen(true);
            }}
          >
            Add Speaker
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <Card variant="glass" className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer select-none"
                >
                  Name
                  {sortBy === "name" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("role")}
                  className="cursor-pointer select-none"
                >
                  Role
                  {sortBy === "role" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("company")}
                  className="cursor-pointer select-none"
                >
                  Company
                  {sortBy === "company"
                    ? sortDir === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("speakerType")}
                  className="cursor-pointer select-none"
                >
                  Type
                  {sortBy === "speakerType"
                    ? sortDir === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sliced.map((s) => (
                <TableRow
                  key={s.id}
                  data-state={selectedId === s.id ? "selected" : undefined}
                  onClick={() => {
                    setSelectedId(s.id);
                    setOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.role ?? "-"}</TableCell>
                  <TableCell>{s.company ?? "-"}</TableCell>
                  <TableCell>{s.speakerType ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Delete this speaker?")) return;
                        await deleteSpeaker(s.id);
                        await fetchSpeakers();
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {filtered.length} items
        </div>
      </Card>

      <SpeakersDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setSelectedId(null);
          setOpen(v);
        }}
        speaker={selected}
        mode={selected ? "edit" : "add"}
        onSubmit={async (values: Partial<Speaker>) => {
          if (selected) {
            await updateSpeaker(selected.id, values);
          } else {
            const copy = { ...(values as Speaker) } as Record<string, unknown>;
            delete copy.id;
            await createSpeaker(copy as Omit<Speaker, "id">);
          }
          await fetchSpeakers();
        }}
      />
    </div>
  );
}
