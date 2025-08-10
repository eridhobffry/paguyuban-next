"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      setUploading(true);
      const res = await fetch("/api/admin/speakers/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      toast.success("Uploaded");
      return data.url;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, uploadFile };
}
