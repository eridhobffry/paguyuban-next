import { createHash } from "crypto";
import { cachePersistence } from "./cache-persistence";
import { memoryPolicyManager } from "./memory-policy";

type Embedding = Map<string, number>; // normalized term frequency vector

export type CacheLocale = "id" | "ms" | "en" | "de";

export interface CacheContext {
  locale: CacheLocale;
  city?: string;
  eventStart?: string; // YYYY-MM-DD
  eventEnd?: string; // YYYY-MM-DD
}

export interface CacheEntry {
  key: string; // fingerprint
  prompt: string;
  normalized: string;
  locale: CacheLocale;
  embedding: Embedding;
  response: string;
  model: string;
  md5OfTools?: string | null;
  costMs?: number;
  evalScore?: number; // optional quality score 0..1
  createdAt: number;
  expiresAt: number;
  hits: number;
}

interface Hit {
  response: string;
  model: string;
  score: number;
  key: string;
  expiresAt: number;
}

// In-memory bounded cache
const STORE = new Map<string, CacheEntry>();
const ORDER: string[] = []; // simple LRU list by insertion
const MAX_ITEMS = 200;

const DEFAULT_THRESHOLD = 0.85;

export async function getCachedResponse(
  prompt: string,
  ctx: CacheContext,
  threshold = DEFAULT_THRESHOLD
): Promise<Hit | null> {
  const normalized = normalize(prompt);
  const emb = toEmbedding(normalized);

  // First check in-memory cache
  let best: { entry: CacheEntry; score: number } | null = null;
  for (const entry of STORE.values()) {
    if (entry.locale !== ctx.locale) continue;
    const score = cosine(entry.embedding, emb);
    if (
      score >= threshold &&
      validateContextMatch(entry.normalized, normalized, ctx)
    ) {
      if (!best || score > best.score) best = { entry, score };
    }
  }

  // If not found in memory, try database
  if (!best) {
    try {
      const similarEntries = await cachePersistence.findSimilar(
        normalized,
        ctx.locale,
        5
      );
      for (const dbEntry of similarEntries) {
        const score = cosine(
          new Map(Object.entries(dbEntry.embeddingVector)),
          emb
        );
        if (
          score >= threshold &&
          validateContextMatch(dbEntry.normalizedQuery, normalized, ctx)
        ) {
          if (!best || score > best.score) {
            // Convert DB entry to CacheEntry format
            const entry: CacheEntry = {
              key: dbEntry.cacheKey,
              prompt: dbEntry.queryText,
              normalized: dbEntry.normalizedQuery,
              locale: dbEntry.locale as CacheLocale,
              embedding: new Map(Object.entries(dbEntry.embeddingVector)),
              response: dbEntry.responseText,
              model: dbEntry.modelUsed || "",
              md5OfTools: dbEntry.md5OfTools,
              costMs: dbEntry.costMs,
              evalScore: dbEntry.evalScore,
              createdAt: dbEntry.createdAt.getTime(),
              expiresAt: dbEntry.expiresAt.getTime(),
              hits: dbEntry.hitCount,
            };
            best = { entry, score };
          }
        }
      }
    } catch (error) {
      console.error("Database cache lookup failed:", error);
    }
  }

  if (!best) return null;

  const e = best.entry;

  // Update hit count in memory
  if (STORE.has(e.key)) {
    const memEntry = STORE.get(e.key)!;
    memEntry.hits += 1;
    memEntry.expiresAt = extendTtl(memEntry.expiresAt, 0.3); // extend 30%
  }

  // Update hit count in database (non-blocking)
  cachePersistence
    .updateHit(e.key)
    .catch((error) => console.error("Failed to update DB cache hit:", error));

  // Opportunistic TTL extension
  e.expiresAt = extendTtl(e.expiresAt, 0.3);

  return {
    response: e.response,
    model: e.model,
    score: best.score,
    key: e.key,
    expiresAt: e.expiresAt,
  };
}

export async function setCachedResponse(
  prompt: string,
  ctx: CacheContext,
  response: string,
  model: string,
  meta?: { md5OfTools?: string | null; costMs?: number; evalScore?: number }
): Promise<CacheEntry> {
  const normalized = normalize(prompt);
  const keySeed = `${normalized}|${ctx.locale}|${ctx.city || ""}|${
    ctx.eventStart || ""
  }|${ctx.eventEnd || ""}`;
  const key = md5(keySeed);
  const embedding = toEmbedding(normalized);
  const now = Date.now();
  const expiresAt = computeExpiry(ctx) || now + 30 * 24 * 3600 * 1000; // default 30 days

  const entry: CacheEntry = {
    key,
    prompt,
    normalized,
    locale: ctx.locale,
    embedding,
    response,
    model,
    md5OfTools: meta?.md5OfTools ?? null,
    costMs: meta?.costMs,
    evalScore: meta?.evalScore,
    createdAt: now,
    expiresAt,
    hits: 0,
  };

  // LRU eviction if needed
  if (!STORE.has(key)) {
    ORDER.push(key);
    if (ORDER.length > MAX_ITEMS) {
      const victim = ORDER.shift();
      if (victim) STORE.delete(victim);
    }
  }
  STORE.set(key, entry);

  // Persist to database (non-blocking)
  cachePersistence
    .store(entry, ctx)
    .catch((error) =>
      console.error("Failed to persist cache entry to DB:", error)
    );

  return entry;
}

export async function purgeExpired(now = Date.now()) {
  // Clean up in-memory cache
  for (const [k, v] of STORE.entries()) {
    if (v.expiresAt <= now) {
      STORE.delete(k);
      const idx = ORDER.indexOf(k);
      if (idx >= 0) ORDER.splice(idx, 1);
    }
  }

  // Clean up database cache (non-blocking)
  try {
    const deletedCount = await cachePersistence.cleanupExpired();
    if (deletedCount > 0) {
      console.log(
        `Cleaned up ${deletedCount} expired cache entries from database`
      );
    }
  } catch (error) {
    console.error("Failed to cleanup expired database cache entries:", error);
  }
}

// --- Cache Statistics and Management ---

export async function getCacheStats() {
  const memStats = {
    inMemoryEntries: STORE.size,
    maxInMemoryEntries: MAX_ITEMS,
    memoryUtilization: (STORE.size / MAX_ITEMS) * 100,
  };

  try {
    const dbStats = await cachePersistence.getStats();
    return {
      ...memStats,
      databaseEntries: dbStats.totalEntries,
      activeDatabaseEntries: dbStats.activeEntries,
      totalDatabaseHits: dbStats.totalHits,
      averageDatabaseHitCount: dbStats.avgHitCount,
    };
  } catch (error) {
    console.error("Failed to get database cache stats:", error);
    return memStats;
  }
}

export async function warmupCache() {
  // This function can be called to preload frequently accessed entries
  // For now, it's a placeholder for future optimization
  try {
    const stats = await getCacheStats();
    console.log("Cache warmup completed:", stats);
  } catch (error) {
    console.error("Cache warmup failed:", error);
  }
}

// --- helpers ---

function normalize(t: string): string {
  return (t || "")
    .toLowerCase()
    .replace(/[\s\n\r\t]+/g, " ")
    .trim();
}

function tokenize(t: string): string[] {
  return t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function toEmbedding(t: string): Embedding {
  const tokens = tokenize(t);
  const counts = new Map<string, number>();
  for (const tok of tokens) counts.set(tok, (counts.get(tok) || 0) + 1);
  const norm =
    Math.sqrt(Array.from(counts.values()).reduce((s, v) => s + v * v, 0)) || 1;
  const emb = new Map<string, number>();
  counts.forEach((v, k) => emb.set(k, v / norm));
  return emb;
}

function cosine(a: Embedding, b: Embedding): number {
  let dot = 0;
  for (const [k, va] of a.entries()) {
    const vb = b.get(k);
    if (vb) dot += va * vb;
  }
  return Math.max(0, Math.min(1, dot));
}

function md5(s: string): string {
  return createHash("md5").update(s).digest("hex");
}

function computeExpiry(ctx: CacheContext): number | null {
  // If event_end exists: end_date + 14d
  if (ctx.eventEnd) {
    const d = Date.parse(ctx.eventEnd + "T00:00:00Z");
    if (!Number.isNaN(d)) return d + 14 * 24 * 3600 * 1000;
  }
  return null;
}

function extendTtl(expiresAt: number, byFraction: number): number {
  const now = Date.now();
  const base = Math.max(expiresAt, now);
  const extra = Math.round((expiresAt - now) * byFraction);
  return base + Math.max(3600_000, extra); // at least +1h
}

function validateContextMatch(
  cachedNorm: string,
  newNorm: string,
  ctx: CacheContext
): boolean {
  // Safety check: ensure dates/years/cities match if present
  const yearsCached = new Set(cachedNorm.match(/\b(20\d{2})\b/g) || []);
  const yearsNew = new Set(newNorm.match(/\b(20\d{2})\b/g) || []);
  if (yearsCached.size && yearsNew.size) {
    let shared = false;
    yearsCached.forEach((y) => {
      if (yearsNew.has(y)) shared = true;
    });
    if (!shared) return false;
  }

  if (ctx.city) {
    const c = ctx.city.toLowerCase().split(/,|\s+/).filter(Boolean);
    if (c.length) {
      const hasCityCached = c.some((w) => cachedNorm.includes(w));
      const hasCityNew = c.some((w) => newNorm.includes(w));
      if (hasCityCached && !hasCityNew) return false;
    }
  }
  return true;
}
