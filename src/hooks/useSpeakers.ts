"use client";

import { useCallback, useEffect, useState } from "react";
import type { Speaker } from "@/types/people";

export function useSpeakersAdmin() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpeakers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/speakers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch speakers");
      const data = await res.json();
      setSpeakers(data.speakers ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpeakers();
  }, [fetchSpeakers]);

  const createSpeaker = useCallback(async (speaker: Omit<Speaker, "id">) => {
    const res = await fetch("/api/admin/speakers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ speaker }),
    });
    if (!res.ok) throw new Error("Failed to create speaker");
    const data = await res.json();
    return data.speaker as Speaker;
  }, []);

  const updateSpeaker = useCallback(
    async (id: string, speaker: Partial<Speaker>) => {
      const res = await fetch("/api/admin/speakers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, speaker }),
      });
      if (!res.ok) throw new Error("Failed to update speaker");
      const data = await res.json();
      return data.speaker as Speaker;
    },
    []
  );

  const deleteSpeaker = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/speakers?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete speaker");
    const data = await res.json();
    return data.speaker as Speaker;
  }, []);

  return {
    speakers,
    loading,
    error,
    fetchSpeakers,
    setSpeakers,
    createSpeaker,
    updateSpeaker,
    deleteSpeaker,
  };
}
