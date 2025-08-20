import path from "path";

// Deep merge for plain objects; arrays and primitives are replaced by overlay
export function deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(base: T, overlay: U): T & U {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(overlay ?? {})) {
    const bv = out[k];
    if (isPlainObject(bv) && isPlainObject(v)) {
      out[k] = deepMerge(bv as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v as unknown;
    }
  }
  return out as T & U;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Load optional JSON/CSV overlay from public/docs
// CSV format expected: path,value where path is dot-notation, e.g. financials.revenue.total,1018660
export async function loadKnowledgeOverlay(): Promise<Record<string, unknown> | null> {
  try {
    // Avoid static fs imports to keep edge compatibility when bundled
    const fs = await import("fs/promises");
    const baseDir = process.cwd();
    const docsDir = path.join(baseDir, "public", "docs");

    let overlay: Record<string, unknown> = {};

    // Try JSON first
    try {
      const jsonPath = path.join(docsDir, "knowledge.json");
      const jsonBuf = await fs.readFile(jsonPath);
      const jsonData = JSON.parse(jsonBuf.toString());
      if (isPlainObject(jsonData)) {
        overlay = deepMerge(overlay, jsonData as Record<string, unknown>);
      }
    } catch {}

    // Then CSV (simple two-column: path,value)
    try {
      const csvPath = path.join(docsDir, "knowledge.csv");
      const csvBuf = await fs.readFile(csvPath);
      const text = csvBuf.toString();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length) {
        const [h1, h2] = lines[0].split(",").map((s) => s.trim().toLowerCase());
        const startIdx = h1 === "path" && h2 === "value" ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
          const [pathKey, rawVal] = splitCsvLine(lines[i]);
          if (!pathKey) continue;
          setDeepValue(overlay, pathKey, parseValue(rawVal));
        }
      }
    } catch {}

    return Object.keys(overlay).length ? overlay : null;
  } catch {
    // Non-fatal
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
  if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(v.replace(/_/g, ""))) return num;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function setDeepValue(obj: Record<string, unknown>, pathKey: string, value: unknown) {
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
