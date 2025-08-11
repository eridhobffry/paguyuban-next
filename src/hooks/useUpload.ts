"use client";

import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";

export function useMediaUpload(
  folder: "speakers" | "artists" | "documents" | "logos" | "agenda" = "speakers"
) {
  const [uploading, setUploading] = useState(false);
  const [temporaryUrls, setTemporaryUrls] = useState<string[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        // Prefer signed client upload. Pathname must include folder.
        const safeName = (file.name || "upload").replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const pathname = `${folder}/${safeName}`;
        const blob = await upload(pathname, file, {
          access: "public",
          // Route that generates client token + receives completion events
          handleUploadUrl: "/api/admin/upload/handle",
          // Pass folder so route can validate
          clientPayload: folder,
          multipart: file.size > 5 * 1024 * 1024,
        });
        toast.success("Uploaded");
        setTemporaryUrls((prev) => [...prev, blob.url]);
        return blob.url;
      } catch (err) {
        console.error("Client upload error:", err);
        // Fallback to server upload for environments where client uploads are not configured
        try {
          const form = new FormData();
          form.append("file", file);
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
        } catch (e) {
          console.error("Server upload error:", e);
          toast.error("Upload failed");
          throw e;
        }
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
