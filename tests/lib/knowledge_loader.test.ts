import { describe, expect, it, vi, beforeEach } from "vitest";

// We'll mock fs/promises used by loadKnowledgeOverlay's dynamic import
vi.mock("fs/promises", () => {
  return {
    readFile: vi.fn(async (filePath: string) => {
      // Default: throw to simulate missing files (tests override below)
      throw Object.assign(new Error(`ENOENT: no such file or directory, open ${filePath}`), { code: "ENOENT" });
    }),
  };
});

import { loadKnowledgeOverlay } from "@/lib/knowledge/loader";
import * as fsProm from "fs/promises";

const readFileMock = fsProm.readFile as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  readFileMock.mockReset();
});

describe("loadKnowledgeOverlay()", () => {
  it("merges JSON overlay when knowledge.json exists", async () => {
    const json = {
      financials: { revenue: { total: "€1" } },
      event: { dates: "Sept 1-2, 2026" },
    };
    readFileMock.mockImplementation(async (p: string) => {
      if (String(p).endsWith("knowledge.json")) return Buffer.from(JSON.stringify(json));
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    const overlay = await loadKnowledgeOverlay();
    expect(overlay).not.toBeNull();
    expect(overlay).toMatchObject({
      financials: { revenue: { total: "€1" } },
      event: { dates: "Sept 1-2, 2026" },
    });
  });

  it("parses CSV overlay when knowledge.csv exists (and JSON missing)", async () => {
    const csv = [
      "path,value",
      'event.dates,"September 10-11, 2026"',
      "financials.revenue.total,1018660",
      'contact.email,"info@paguyuban-messe.com"',
    ].join("\n");

    readFileMock.mockImplementation(async (p: string) => {
      if (String(p).endsWith("knowledge.json")) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      if (String(p).endsWith("knowledge.csv")) return Buffer.from(csv);
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    const overlay = await loadKnowledgeOverlay();
    expect(overlay).not.toBeNull();
    expect(overlay).toMatchObject({
      event: { dates: "September 10-11, 2026" },
      financials: { revenue: { total: 1018660 } },
      contact: { email: "info@paguyuban-messe.com" },
    });
  });
});
