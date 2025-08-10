"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
    try {
      const res = await fetch("/api/admin/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ speaker }),
      });
      if (!res.ok) throw new Error("Failed to create speaker");
      const data = await res.json();
      toast.success("Speaker created");
      return data.speaker as Speaker;
    } catch (e) {
      toast.error("Create failed");
      throw e;
    }
  }, []);

  const updateSpeaker = useCallback(
    async (id: string, speaker: Partial<Speaker>) => {
      try {
        const res = await fetch("/api/admin/speakers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, speaker }),
        });
        if (!res.ok) throw new Error("Failed to update speaker");
        const data = await res.json();
        toast.success("Speaker updated");
        return data.speaker as Speaker;
      } catch (e) {
        toast.error("Update failed");
        throw e;
      }
    },
    []
  );

  const deleteSpeaker = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/speakers?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete speaker");
      const data = await res.json();
      toast.success("Speaker deleted");
      return data.speaker as Speaker;
    } catch (e) {
      toast.error("Delete failed");
      throw e;
    }
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
