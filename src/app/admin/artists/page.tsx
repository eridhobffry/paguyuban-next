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
import {
  ArtistsDialog,
  type ArtistFormValues,
} from "@/components/admin/ArtistsDialog";
import { useArtistsAdmin } from "@/hooks/useArtists";
import type { Artist as DbArtist } from "@/types/people";

const createDataMapper = (artist: ArtistFormValues): Omit<DbArtist, "id"> => {
  const now = new Date();
  return {
    name: artist.name,
    role: artist.role ?? null,
    company: artist.company ?? null,
    imageUrl: artist.imageUrl ?? null,
    bio: artist.bio ?? null,
    tags: artist.tags ?? null,
    slug: artist.slug ?? null,
    instagram: artist.instagram ?? null,
    youtube: artist.youtube ?? null,
    twitter: artist.twitter ?? null,
    linkedin: artist.linkedin ?? null,
    website: artist.website ?? null,
    sortOrder: artist.sortOrder ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

export default function ArtistsAdminPage() {
  const { artists, fetchArtists, createArtist, updateArtist, deleteArtist } =
    useArtistsAdmin();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingArtist = useMemo(
    () => artists.find((a) => a.id === editingId),
    [artists, editingId]
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Artists</h1>
          <p className="text-muted-foreground">
            Manage artists data and details.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchArtists()}>
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              setOpen(false);
              // ensure dialog resets
              setTimeout(() => setOpen(true), 0);
            }}
          >
            Add Artist
          </Button>
        </div>
      </div>

      <Card variant="glass" className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artists.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell>{a.company}</TableCell>
                  <TableCell>{a.slug}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(a.id);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteArtist(a.id);
                        await fetchArtists();
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
      </Card>

      <ArtistsDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setEditingId(null);
          setOpen(v);
        }}
        initial={editingArtist as ArtistFormValues}
        onSubmit={async (values: ArtistFormValues) => {
          const payload = {
            ...values,
            tags: values.tags ?? [],
          };
          if (editingId) {
            await updateArtist(editingId, payload);
          } else {
            await createArtist(createDataMapper(payload));
          }
          await fetchArtists();
        }}
      />
    </div>
  );
}
