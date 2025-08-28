import { describe, it, expect } from "vitest";
import { hasUserConsent, requiredConsentVersion } from "@/lib/security/consent";

function headersFrom(obj: Record<string, string>) {
  const h = new Headers();
  for (const [k, v] of Object.entries(obj)) h.set(k, v);
  return h;
}

describe("consent header", () => {
  it("rejects when header missing", () => {
    const ok = hasUserConsent(headersFrom({}));
    expect(ok).toBe(false);
  });

  it("accepts when header matches required version", () => {
    const req = requiredConsentVersion();
    const ok = hasUserConsent(headersFrom({ "x-ai-consent": req }));
    expect(ok).toBe(true);
  });

  it("rejects when header mismatches version", () => {
    const ok = hasUserConsent(headersFrom({ "x-ai-consent": "v0" }));
    expect(ok).toBe(false);
  });
});

