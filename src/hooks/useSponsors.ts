"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Sponsor } from "@/types/people";
import { useMediaUpload } from "@/hooks/useUpload";

export function useSponsorsAdmin() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use shared upload utility; store to `logos/` folder
  const { uploading, uploadFile: uploadLogo, discardTemp, commitTemp } =
    useMediaUpload("logos");

  const fetchSponsors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/sponsors", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch sponsors");
      const data = (await res.json()) as { sponsors: Sponsor[] };
      setSponsors(data.sponsors ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const createSponsor = useCallback(async (sponsor: Omit<Sponsor, "id">) => {
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sponsor }),
      });
      if (!res.ok) throw new Error("Failed to create sponsor");
      const data = (await res.json()) as { sponsor: Sponsor };
      toast.success("Sponsor created");
      return data.sponsor;
    } catch (e) {
      toast.error("Create failed");
      throw e;
    }
  }, []);

  const updateSponsor = useCallback(
    async (id: string, sponsor: Partial<Sponsor>) => {
      try {
        const res = await fetch("/api/admin/sponsors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, sponsor }),
        });
        if (!res.ok) throw new Error("Failed to update sponsor");
        const data = (await res.json()) as { sponsor: Sponsor };
        toast.success("Sponsor updated");
        return data.sponsor;
      } catch (e) {
        toast.error("Update failed");
        throw e;
      }
    },
    []
  );

  const deleteSponsor = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sponsors?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete sponsor");
      const data = (await res.json()) as { sponsor: Sponsor };
      toast.success("Sponsor deleted");
      return data.sponsor;
    } catch (e) {
      toast.error("Delete failed");
      throw e;
    }
  }, []);

  return {
    sponsors,
    loading,
    error,
    uploading,
    fetchSponsors,
    setSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    uploadLogo,
    discardTemp,
    commitTemp,
  };
}
