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
const IS_TEST = process.env.NODE_ENV === "test";

// Load knowledge overlay from database with TTL caching
async function loadDbKnowledgeOverlay(): Promise<Record<
  string,
  unknown
> | null> {
  try {
    // Check cache first (disabled during tests to avoid cross-test contamination)
    if (!IS_TEST) {
      if (cachedDbKnowledge && cacheExpiry && cacheExpiry > new Date()) {
        return cachedDbKnowledge;
      }
    }

    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    if (!activeKnowledge.length) {
      // Cache empty result for 1 minute (skip in tests)
      if (!IS_TEST) {
        cachedDbKnowledge = null;
        cacheExpiry = new Date(Date.now() + 60 * 1000);
      }
      return null;
    }

    const overlay = activeKnowledge[0].overlay as Record<string, unknown>;

    // Cache the result (skip in tests)
    if (!IS_TEST) {
      cachedDbKnowledge = overlay;
      cacheExpiry = new Date(Date.now() + CACHE_TTL_MS);
    }

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
        const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
        if (lines.length) {
          // Validate header if present and ensure each row has exactly one unquoted comma
          const [h1, h2, malformedHeader] = inspectHeader(lines[0]);
          if (malformedHeader) {
            // Treat malformed CSV as unusable
            throw new Error("Malformed CSV header");
          }
          const startIdx = h1 === "path" && h2 === "value" ? 1 : 0;
          let malformed = false;
          for (let i = startIdx; i < lines.length; i++) {
            if (countUnquotedCommas(lines[i]) !== 1) {
              malformed = true;
              break;
            }
            const [pathKey, rawVal] = splitCsvLine(lines[i]);
            if (!pathKey) continue;
            setDeepValue(finalOverlay, pathKey, parseValue(rawVal));
          }
          if (malformed) {
            // If CSV is malformed, discard any partial overlay changes from it
            // by resetting keys it might have set. Safer approach: recompute from JSON only.
            finalOverlay = Object.fromEntries(
              Object.entries(finalOverlay).filter(([k]) => k !== "")
            );
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
  // Parse into exactly two columns while respecting quoted sections.
  let inQuotes = false;
  let sepIndex = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      sepIndex = i;
      break;
    }
  }
  const rawKey = sepIndex >= 0 ? line.slice(0, sepIndex) : line;
  const rawVal = sepIndex >= 0 ? line.slice(sepIndex + 1) : "";
  const key = unquote(rawKey.trim());
  const val = unquote(rawVal.trim());
  return [key, val];
}

function unquote(s: string): string {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/""/g, '"');
  }
  return s;
}

function countUnquotedCommas(line: string): number {
  let inQuotes = false;
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      count++;
    }
  }
  return count;
}

function inspectHeader(line: string): [string, string, boolean] {
  const commas = countUnquotedCommas(line);
  if (commas !== 1) return ["", "", true];
  const [k, v] = splitCsvLine(line);
  return [k.trim().toLowerCase(), v.trim().toLowerCase(), false];
}

function parseValue(v: string): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (v === "") return "";
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
  // If an exact dotted key already exists, override it directly
  if (Object.prototype.hasOwnProperty.call(obj, pathKey)) {
    obj[pathKey] = value as unknown as never;
    return;
  }
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
