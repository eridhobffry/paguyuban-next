import { del as deleteBlob } from "@vercel/blob";
import { blobRefCounters } from "@/lib/blob-config";

export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.endsWith("public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function deleteBlobIfUnreferenced(url: string): Promise<void> {
  if (!isVercelBlobUrl(url)) return;
  try {
    const counts = await Promise.all(blobRefCounters.map((fn) => fn(url)));
    const totalRefs = counts.reduce((s, n) => s + (n || 0), 0);
    if (totalRefs === 0) {
      await deleteBlob(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
  } catch (err) {
    console.error("deleteBlobIfUnreferenced failed:", err);
  }
}
