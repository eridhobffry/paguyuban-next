"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useMediaUpload(
  folder: "speakers" | "artists" | "documents" | "logos" | "agenda" = "speakers"
) {
  const [uploading, setUploading] = useState(false);
  const [temporaryUrls, setTemporaryUrls] = useState<string[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      try {
        setUploading(true);
        const res = await fetch(`/api/admin/upload?folder=${folder}`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = (await res.json()) as { url: string };
        toast.success("Uploaded");
        setTemporaryUrls((prev) => [...prev, data.url]);
        return data.url;
      } finally {
        setUploading(false);
      }
    },
    [folder]
  );

  const discardTemp = useCallback(async () => {
    if (temporaryUrls.length === 0) return;
    const urls = [...temporaryUrls];
    setTemporaryUrls([]);
    await Promise.allSettled(
      urls.map((url) =>
        fetch(`/api/admin/upload?url=${encodeURIComponent(url)}`, {
          method: "DELETE",
          credentials: "include",
        })
      )
    );
  }, [temporaryUrls]);

  const commitTemp = useCallback(() => {
    setTemporaryUrls([]);
  }, []);

  return { uploading, uploadFile, discardTemp, commitTemp };
}
