import { describe, it, expect } from "vitest";
import { sanitizeInput, redactPII, sanitizeOutput } from "@/lib/security/sanitize";

describe("security utils", () => {
  it("sanitizes HTML and scripts and caps length", () => {
    const input = '<script>alert(1)</script><b>Hello</b>   World!\n' + "x".repeat(5000);
    const out = sanitizeInput(input, 50);
    expect(out.includes("<script>")).toBe(false);
    expect(out.includes("<b>")).toBe(false);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out).toMatch(/Hello World!/);
  });

  it("redacts emails, phones, and IPs", () => {
    const t = "Email me test@example.com or +62 812-3456-7890 from 10.0.0.1";
    const r = redactPII(t);
    expect(r).not.toMatch(/example\.com/);
    expect(r).not.toMatch(/10\.0\.0\.1/);
    expect(r).not.toMatch(/812-3456-7890/);
    expect(r).toMatch(/\[EMAIL\]/);
    expect(r).toMatch(/\[PHONE\]/);
    expect(r).toMatch(/\[IP\]/);
  });

  it("guards against system prompt leakage", () => {
    const leak = "BEGIN SYSTEM PROMPT\nJWT_SECRET=abc\nEND SYSTEM PROMPT";
    const safe = sanitizeOutput(leak);
    expect(safe).toMatch(/can.?t share/i);
  });
});
