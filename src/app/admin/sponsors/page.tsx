"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sponsor, SponsorTier } from "@/types/people";
import { useSponsorsAdmin } from "@/hooks/useSponsors";

export default function SponsorsAdminPage() {
  const {
    sponsors,
    loading,
    error,
    fetchSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    uploadLogo,
    uploading,
    discardTemp,
    commitTemp,
  } = useSponsorsAdmin();

  const [tiers, setTiers] = useState<SponsorTier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState<number>(25);
  type SortBy = "name" | "slug" | "sortOrder";
  type SortDir = "asc" | "desc";
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    // Load tiers from public endpoint for UI selection
    void (async () => {
      try {
        const res = await fetch("/api/sponsors/public", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          sponsors: Sponsor[];
          sponsorTiers: SponsorTier[];
        };
        setTiers(data.sponsorTiers ?? []);
      } catch {}
    })();
  }, []);

  const selected = useMemo(
    () => sponsors.find((s) => s.id === selectedId) ?? null,
    [sponsors, selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return sponsors.filter((s) =>
      (s.name + (s.slug ?? "") + (s.url ?? "")).toLowerCase().includes(q)
    );
  }, [sponsors, query]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortBy] ?? "") as string | number;
      const bVal = (b[sortBy] ?? "") as string | number;
      if (typeof aVal === "number" && typeof bVal === "number")
        return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
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
          <h1 className="text-2xl md:text-3xl font-semibold">Sponsors</h1>
          <p className="text-muted-foreground">Manage sponsors & logos.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search..."
            className="w-64 hidden md:block"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
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
          <Button variant="outline" onClick={() => fetchSponsors()} disabled={loading}>
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedId(null);
              setOpen(true);
            }}
          >
            Add Sponsor
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
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer select-none">
                  Name
                  {sortBy === "name" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Website</TableHead>
                <TableHead onClick={() => handleSort("slug")} className="cursor-pointer select-none">
                  Slug
                  {sortBy === "slug" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </TableHead>
                <TableHead onClick={() => handleSort("sortOrder")} className="cursor-pointer select-none">
                  Order
                  {sortBy === "sortOrder" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
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
                  <TableCell>
                    {tiers.find((t) => t.id === s.tierId)?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.url}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{s.slug ?? "-"}</TableCell>
                  <TableCell>{s.sortOrder ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Delete this sponsor?")) return;
                        await deleteSponsor(s.id);
                        await fetchSponsors();
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
        <div className="mt-2 text-sm text-muted-foreground">{filtered.length} items</div>
      </Card>

      <SponsorDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setSelectedId(null);
          if (!v) void discardTemp();
          setOpen(v);
        }}
        sponsor={selected}
        tiers={tiers}
        onSubmit={async (values) => {
          if (selected) {
            await updateSponsor(selected.id, values);
          } else {
            const copy = { ...(values as Sponsor) } as Record<string, unknown>;
            delete copy.id;
            await createSponsor(copy as Omit<Sponsor, "id">);
          }
          commitTemp();
          await fetchSponsors();
        }}
        uploadLogo={uploadLogo}
        uploading={uploading}
      />
    </div>
  );
}

function SponsorDialog({
  open,
  onOpenChange,
  sponsor,
  tiers,
  onSubmit,
  uploadLogo,
  uploading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sponsor: Sponsor | null;
  tiers: SponsorTier[];
  onSubmit: (values: Partial<Sponsor>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  uploading: boolean;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [tierId, setTierId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [tags, setTags] = useState("");
  const [sortOrder, setSortOrder] = useState<number | "">("");

  useEffect(() => {
    if (open) {
      setName(sponsor?.name ?? "");
      setUrl((sponsor?.url as string | null) ?? "");
      setSlug((sponsor?.slug as string | null) ?? "");
      setTierId((sponsor?.tierId as string | null) ?? null);
      setLogoUrl((sponsor?.logoUrl as string | null) ?? "");
      setTags(((sponsor?.tags as string[] | null) ?? []).join(", "));
      setSortOrder((sponsor?.sortOrder as number | null) ?? "");
    }
  }, [open, sponsor]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="sponsor-dialog"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl rounded-md bg-background p-4 shadow-xl"
        data-testid="sponsor-dialog-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-3">{sponsor ? "Edit Sponsor" : "Add Sponsor"}</h2>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Name</label>
            <Input
              data-testid="sponsor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1 md:grid-cols-2">
            <div>
              <label className="text-sm">Website</label>
              <Input
                data-testid="sponsor-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm">Slug</label>
              <Input
                data-testid="sponsor-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1 md:grid-cols-2">
            <div>
              <label className="text-sm">Tier</label>
              <Select value={tierId ?? undefined} onValueChange={(v) => setTierId(v === "__none__" ? null : v)}>
                <SelectTrigger data-testid="sponsor-tier">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {tiers.map((t) => (
                    <SelectItem key={t.id} value={t.id as string}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Sort Order</label>
              <Input
                type="number"
                data-testid="sponsor-sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Upload Logo</label>
            <input
              type="file"
              accept="image/*"
              data-testid="logo-file"
              onChange={async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0] ?? undefined;
                if (!file) return;
                try {
                  const url = await uploadLogo(file);
                  setLogoUrl(url);
                } catch {}
              }}
            />
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="mt-2 h-16 w-16 object-contain" />
            ) : null}
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Logo URL</label>
            <Input
              data-testid="sponsor-logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Tags (comma separated)</label>
            <Input
              data-testid="sponsor-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await onSubmit({
                  name,
                  url: url || null,
                  slug: slug || null,
                  tierId: tierId || null,
                  logoUrl: logoUrl || null,
                  tags: tags
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  sortOrder: sortOrder === "" ? null : Number(sortOrder),
                });
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
