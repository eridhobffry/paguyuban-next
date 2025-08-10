"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentRow } from "@/types/documents";
import { useAdminData } from "./useAdminData";

type LiveMode = "legacy" | "polling";

export function useDocumentsLive() {
  const enabled = process.env.NEXT_PUBLIC_EXPERIMENT_DOCUMENTS_SYNC === "1";

  // Legacy path uses existing admin data hook
  const legacy = useAdminData();

  const [liveDocs, setLiveDocs] = useState<DocumentRow[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simple gated polling placeholder for live updates (off by default)
  useEffect(() => {
    if (!enabled) return;
    setLiveLoading(true);
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/admin/documents", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { documents: DocumentRow[] };
        setLiveDocs(data.documents);
      } finally {
        setLiveLoading(false);
      }
    };
    // initial
    void fetchDocs();
    // poll
    pollTimer.current = setInterval(fetchDocs, 3000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [enabled]);

  const mode: LiveMode = enabled ? "polling" : "legacy";

  const refresh = useMemo(() => {
    if (!enabled) return legacy.fetchDocuments;
    return async () => {
      try {
        const res = await fetch("/api/admin/documents", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { documents: DocumentRow[] };
        setLiveDocs(data.documents);
      } catch {
        // ignore
      }
    };
  }, [enabled, legacy.fetchDocuments]);

  return enabled
    ? { documents: liveDocs ?? [], loading: liveLoading, refresh, mode }
    : { documents: legacy.documents, loading: legacy.loading, refresh, mode };
}
