import { db } from "@/lib/db/drizzle";
import { artists, speakers, documents } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type BlobRefCounter = (url: string) => Promise<number>;

// Registry of DB columns that may store Vercel Blob URLs.
// Extend this list as new domains adopt blob-backed media (e.g., agenda, documents, site logos).
export const blobRefCounters: BlobRefCounter[] = [
  async (url: string) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(speakers)
      .where(eq(speakers.imageUrl, url));
    return Number(row?.count ?? 0);
  },
  async (url: string) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(artists)
      .where(eq(artists.imageUrl, url));
    return Number(row?.count ?? 0);
  },
  async (url: string) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.fileUrl, url));
    return Number(row?.count ?? 0);
  },
];
