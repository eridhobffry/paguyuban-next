import { db } from "../db/drizzle";
import { semanticCacheEntries } from "../db/schema";
import { eq, and, lt, gte, desc, sql } from "drizzle-orm";
import type { CacheEntry, CacheContext } from "./semantic-cache";

export interface DBSemanticCacheEntry {
  id: string;
  cacheKey: string;
  queryText: string;
  normalizedQuery: string;
  locale: string;
  embeddingVector: Record<string, number>;
  responseText: string;
  modelUsed?: string;
  contextMetadata: CacheContext;
  md5OfTools?: string;
  costMs?: number;
  evalScore?: number;
  hitCount: number;
  lastHitAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CachePersistence {
  /**
   * Store a cache entry in the database
   */
  async store(entry: CacheEntry, context: CacheContext): Promise<void> {
    try {
      const dbEntry = this.transformToDBEntry(entry, context);

      await db
        .insert(semanticCacheEntries)
        .values({
          cacheKey: dbEntry.cacheKey,
          queryText: dbEntry.queryText,
          normalizedQuery: dbEntry.normalizedQuery,
          locale: dbEntry.locale,
          embeddingVector: dbEntry.embeddingVector,
          responseText: dbEntry.responseText,
          modelUsed: dbEntry.modelUsed,
          contextMetadata: dbEntry.contextMetadata,
          md5OfTools: dbEntry.md5OfTools,
          costMs: dbEntry.costMs,
          evalScore: dbEntry.evalScore,
          hitCount: dbEntry.hitCount,
          expiresAt: dbEntry.expiresAt,
          lastHitAt: dbEntry.lastHitAt,
        })
        .onConflictDoUpdate({
          target: semanticCacheEntries.cacheKey,
          set: {
            hitCount: dbEntry.hitCount,
            lastHitAt: dbEntry.lastHitAt,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Failed to store cache entry:", error);
      // Don't throw - cache persistence should be non-blocking
    }
  }

  /**
   * Retrieve a cache entry from the database
   */
  async retrieve(cacheKey: string): Promise<CacheEntry | null> {
    try {
      const result = await db
        .select()
        .from(semanticCacheEntries)
        .where(
          and(
            eq(semanticCacheEntries.cacheKey, cacheKey),
            gte(semanticCacheEntries.expiresAt, new Date())
          )
        )
        .limit(1);

      if (result.length === 0) return null;

      const dbEntry = result[0];
      return this.transformFromDBEntry(dbEntry);
    } catch (error) {
      console.error("Failed to retrieve cache entry:", error);
      return null;
    }
  }

  /**
   * Find similar entries using semantic search
   */
  async findSimilar(
    normalizedQuery: string,
    locale: string,
    limit: number = 10
  ): Promise<DBSemanticCacheEntry[]> {
    try {
      // For now, we'll use a simple text similarity search
      // In production, you'd want vector similarity search with pgvector
      const result = await db
        .select()
        .from(semanticCacheEntries)
        .where(
          and(
            eq(semanticCacheEntries.locale, locale),
            gte(semanticCacheEntries.expiresAt, new Date())
          )
        )
        .orderBy(desc(semanticCacheEntries.hitCount))
        .limit(limit);

      return result.map(
        (entry) => this.transformFromDBEntry(entry) as DBSemanticCacheEntry
      );
    } catch (error) {
      console.error("Failed to find similar cache entries:", error);
      return [];
    }
  }

  /**
   * Update hit count for a cache entry
   */
  async updateHit(cacheKey: string): Promise<void> {
    try {
      await db
        .update(semanticCacheEntries)
        .set({
          hitCount: sql`${semanticCacheEntries.hitCount} + 1`,
          lastHitAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(semanticCacheEntries.cacheKey, cacheKey));
    } catch (error) {
      console.error("Failed to update cache hit:", error);
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await db
        .delete(semanticCacheEntries)
        .where(lt(semanticCacheEntries.expiresAt, new Date()))
        .returning({ id: semanticCacheEntries.id });

      return result.length;
    } catch (error) {
      console.error("Failed to cleanup expired cache entries:", error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    activeEntries: number;
    totalHits: number;
    avgHitCount: number;
  }> {
    try {
      const stats = await db
        .select({
          totalEntries: sql<number>`count(*)`,
          activeEntries: sql<number>`count(case when ${semanticCacheEntries.expiresAt} > now() then 1 end)`,
          totalHits: sql<number>`sum(${semanticCacheEntries.hitCount})`,
          avgHitCount: sql<number>`avg(${semanticCacheEntries.hitCount})`,
        })
        .from(semanticCacheEntries);

      return stats[0];
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {
        totalEntries: 0,
        activeEntries: 0,
        totalHits: 0,
        avgHitCount: 0,
      };
    }
  }

  /**
   * Transform CacheEntry to database format
   */
  private transformToDBEntry(
    entry: CacheEntry,
    context: CacheContext
  ): DBSemanticCacheEntry {
    return {
      id: "", // Will be auto-generated
      cacheKey: entry.key,
      queryText: entry.prompt,
      normalizedQuery: entry.normalized,
      locale: entry.locale,
      embeddingVector: Object.fromEntries(entry.embedding),
      responseText: entry.response,
      modelUsed: entry.model,
      contextMetadata: context,
      md5OfTools: entry.md5OfTools || undefined,
      costMs: entry.costMs,
      evalScore: entry.evalScore,
      hitCount: entry.hits,
      expiresAt: new Date(entry.expiresAt),
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(),
      lastHitAt: entry.hits > 0 ? new Date() : undefined,
    };
  }

  /**
   * Transform database entry to CacheEntry format
   */
  private transformFromDBEntry(dbEntry: any): CacheEntry {
    return {
      key: dbEntry.cache_key,
      prompt: dbEntry.query_text,
      normalized: dbEntry.normalized_query,
      locale: dbEntry.locale as any,
      embedding: new Map(Object.entries(dbEntry.embedding_vector || {})),
      response: dbEntry.response_text,
      model: dbEntry.model_used || "",
      md5OfTools: dbEntry.md5_of_tools,
      costMs: dbEntry.cost_ms,
      evalScore: dbEntry.eval_score,
      createdAt: new Date(dbEntry.created_at).getTime(),
      expiresAt: new Date(dbEntry.expires_at).getTime(),
      hits: dbEntry.hit_count,
    };
  }
}

// Singleton instance
export const cachePersistence = new CachePersistence();
