import { describe, it, expect } from "vitest";
import { redact } from "@/lib/ai/context/redact";

describe("ai/context/redact", () => {
  it("redacts emails by default", () => {
    const input = "Contact me at user@example.com for details.";
    const out = redact(input);
    expect(out.text).toContain("[REDACTED:email]");
    expect(out.stats.counts.email).toBeGreaterThanOrEqual(1);
  });

  it("respects allowlist for specific values", () => {
    const input = "Reach admin@site.com or user@site.com";
    const out = redact(input, { allowlist: ["admin@site.com"] });
    expect(out.text).toContain("admin@site.com");
    expect(out.text).toContain("[REDACTED:email]");
    expect(out.stats.counts.email).toBeGreaterThanOrEqual(1);
  });

  it("redacts JWT-like tokens", () => {
    const token = "abc.def.ghi";
    const input = `Token: ${token}`;
    const out = redact(input);
    expect(out.text).toContain("[REDACTED:token]");
    expect(out.stats.counts.token).toBe(1);
  });

  it("redacts long hex secrets (32+ chars)", () => {
    const secret = "0123456789abcdef0123456789abcdef"; // 32 hex
    const out = redact(`secret: ${secret}`);
    expect(out.text).toContain("[REDACTED:secret]");
    expect(out.stats.counts.secret).toBe(1);
  });

  it("redacts likely phone numbers but avoids short numbers", () => {
    const input = "Call +62 812-3456-7890 now. Room 12 is ready.";
    const out = redact(input);
    expect(out.text).toContain("[REDACTED:phone]");
    // Ensure short number remains
    expect(out.text).toContain("Room 12");
    expect(out.stats.counts.phone).toBeGreaterThanOrEqual(1);
  });
});
