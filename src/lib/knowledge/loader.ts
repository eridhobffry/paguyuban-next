import path from "path";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";

// Deep merge for plain objects; arrays and primitives are replaced by overlay
export function deepMerge<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>
>(base: T, overlay: U): T & U {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(overlay ?? {})) {
    const bv = out[k];
    if (isPlainObject(bv) && isPlainObject(v)) {
      out[k] = deepMerge(
        bv as Record<string, unknown>,
        v as Record<string, unknown>
      );
    } else {
      out[k] = v as unknown;
    }
  }
  return out as T & U;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Cache for database knowledge overlay
let cachedDbKnowledge: Record<string, unknown> | null = null;
let cacheExpiry: Date | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Load knowledge overlay from database with TTL caching
async function loadDbKnowledgeOverlay(): Promise<Record<
  string,
  unknown
> | null> {
  try {
    // Check cache first
    if (cachedDbKnowledge && cacheExpiry && cacheExpiry > new Date()) {
      return cachedDbKnowledge;
    }

    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    if (!activeKnowledge.length) {
      // Cache empty result for 1 minute
      cachedDbKnowledge = null;
      cacheExpiry = new Date(Date.now() + 60 * 1000);
      return null;
    }

    const overlay = activeKnowledge[0].overlay as Record<string, unknown>;

    // Cache the result
    cachedDbKnowledge = overlay;
    cacheExpiry = new Date(Date.now() + CACHE_TTL_MS);

    return overlay;
  } catch (error) {
    console.warn("Database knowledge overlay load failed:", error);
    return null;
  }
}

// Load knowledge overlay from multiple sources (Database, JSON, CSV)
export async function loadKnowledgeOverlay(): Promise<Record<
  string,
  unknown
> | null> {
  try {
    let finalOverlay: Record<string, unknown> = {};

    // 1. Load from database first (highest priority)
    try {
      const dbOverlay = await loadDbKnowledgeOverlay();
      if (dbOverlay && Object.keys(dbOverlay).length) {
        finalOverlay = deepMerge(finalOverlay, dbOverlay);
      }
    } catch (error) {
      console.warn("Failed to load database knowledge overlay:", error);
    }

    // 2. Load from file system (fallback/additional data)
    try {
      // Avoid static fs imports to keep edge compatibility when bundled
      const fs = await import("fs/promises");
      const baseDir = process.cwd();
      const docsDir = path.join(baseDir, "public", "docs");

      // Try JSON first
      try {
        const jsonPath = path.join(docsDir, "knowledge.json");
        const jsonBuf = await fs.readFile(jsonPath);
        const jsonData = JSON.parse(jsonBuf.toString());
        if (isPlainObject(jsonData)) {
          finalOverlay = deepMerge(
            finalOverlay,
            jsonData as Record<string, unknown>
          );
        }
      } catch {}

      // Then CSV (simple two-column: path,value)
      try {
        const csvPath = path.join(docsDir, "knowledge.csv");
        const csvBuf = await fs.readFile(csvPath);
        const text = csvBuf.toString();
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length) {
          const [h1, h2] = lines[0]
            .split(",")
            .map((s) => s.trim().toLowerCase());
          const startIdx = h1 === "path" && h2 === "value" ? 1 : 0;
          for (let i = startIdx; i < lines.length; i++) {
            const [pathKey, rawVal] = splitCsvLine(lines[i]);
            if (!pathKey) continue;
            setDeepValue(finalOverlay, pathKey, parseValue(rawVal));
          }
        }
      } catch {}
    } catch (error) {
      console.warn("Failed to load file system knowledge overlay:", error);
    }

    return Object.keys(finalOverlay).length ? finalOverlay : null;
  } catch (error) {
    console.warn("Failed to load knowledge overlay:", error);
    return null;
  }
}

function splitCsvLine(line: string): [string, string] {
  // Minimal CSV parsing: supports commas inside quotes
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  const key = (result[0] ?? "").trim();
  const val = (result[1] ?? "").trim();
  return [key, val];
}

function parseValue(v: string): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "") return null;
  const num = Number(v.replace(/_/g, ""));
  if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(v.replace(/_/g, "")))
    return num;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function setDeepValue(
  obj: Record<string, unknown>,
  pathKey: string,
  value: unknown
) {
  const keys = pathKey.split(".").filter(Boolean);
  let ref: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i] as string;
    if (i === keys.length - 1) {
      ref[k] = value;
    } else {
      const next = ref[k];
      if (!isPlainObject(next)) ref[k] = {};
      ref = ref[k] as Record<string, unknown>;
    }
  }
}
