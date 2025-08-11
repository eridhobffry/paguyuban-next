"use client";

import { useCallback, useEffect, useState } from "react";
import type { Artist as DbArtist } from "@/types/people";

export function useArtistsAdmin() {
  const [artists, setArtists] = useState<DbArtist[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/artists", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch artists");
      const data = await res.json();
      setArtists(data.artists ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createArtist = useCallback(async (artist: Omit<DbArtist, "id">) => {
    const res = await fetch("/api/admin/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ artist }),
    });
    if (!res.ok) throw new Error("Failed to create artist");
    const data = await res.json();
    return data.artist as DbArtist;
  }, []);

  const updateArtist = useCallback(
    async (id: string, artist: Partial<DbArtist>) => {
      const res = await fetch("/api/admin/artists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, artist }),
      });
      if (!res.ok) throw new Error("Failed to update artist");
      const data = await res.json();
      return data.artist as DbArtist;
    },
    []
  );

  const deleteArtist = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/artists?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete artist");
    const data = await res.json();
    return data.artist as DbArtist;
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  return {
    artists,
    loading,
    error,
    fetchArtists,
    createArtist,
    updateArtist,
    deleteArtist,
    setArtists,
  };
}
