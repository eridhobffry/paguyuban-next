import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// CSV parsing function
function parseCSV(csvText: string): Record<string, unknown> {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return {};

  const [header1, header2] = lines[0]
    .split(",")
    .map((s) => s.trim().toLowerCase());
  const startIdx = header1 === "path" && header2 === "value" ? 1 : 0;

  const result: Record<string, unknown> = {};

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const [pathKey, rawVal] = splitCSVLine(line);
    if (!pathKey) continue;

    const value = parseValue(rawVal.trim());
    setDeepValue(result, pathKey, value);
  }

  return result;
}

function splitCSVLine(line: string): [string, string] {
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
  if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(v.replace(/_/g, ""))) {
    return num;
  }

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
    const k = keys[i];
    if (i === keys.length - 1) {
      ref[k] = value;
    } else {
      const next = ref[k];
      if (!isPlainObject(next)) ref[k] = {};
      ref = ref[k] as Record<string, unknown>;
    }
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// POST /api/admin/knowledge/upload - Upload and parse CSV file
export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);

    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["text/csv", "application/vnd.ms-excel"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();

    // Parse CSV
    const parsedData = parseCSV(text);

    if (Object.keys(parsedData).length === 0) {
      return NextResponse.json(
        { error: "No valid data found in CSV" },
        { status: 400 }
      );
    }

    // Get current active knowledge to merge with
    const currentKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    let existingOverlay: Record<string, unknown> = {};
    if (currentKnowledge.length > 0) {
      existingOverlay = currentKnowledge[0].overlay as Record<string, unknown>;
    }

    // Deep merge existing overlay with new CSV data
    const mergedOverlay = deepMerge(existingOverlay, parsedData);

    // Update or create knowledge overlay
    if (currentKnowledge.length > 0) {
      const [updatedKnowledge] = await db
        .update(knowledge)
        .set({
          overlay: mergedOverlay,
          updatedAt: new Date(),
        })
        .where(eq(knowledge.id, currentKnowledge[0].id))
        .returning();

      return NextResponse.json({
        message: "CSV data merged successfully",
        recordsProcessed: Object.keys(parsedData).length,
        id: updatedKnowledge.id,
        overlay: updatedKnowledge.overlay,
      });
    } else {
      const [newKnowledge] = await db
        .insert(knowledge)
        .values({
          overlay: mergedOverlay,
          isActive: true,
        })
        .returning();

      return NextResponse.json(
        {
          message: "CSV data uploaded successfully",
          recordsProcessed: Object.keys(parsedData).length,
          id: newKnowledge.id,
          overlay: newKnowledge.overlay,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error uploading CSV:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 }
    );
  }
}

// Deep merge function for combining knowledge overlays
function deepMerge<
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
