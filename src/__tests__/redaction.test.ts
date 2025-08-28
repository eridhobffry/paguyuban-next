import { describe, it, expect, beforeAll } from "vitest";
import { redactNames, sanitizeAndRedactProspect } from "@/lib/security/sanitize";

describe("name redaction and prospect sanitization", () => {
  beforeAll(() => {
    process.env.AI_REDACT_NAMES = "1";
  });

  it("redacts simple First Last patterns", () => {
    const s = "Hello John Doe, welcome to Paguyuban.";
    const r = redactNames(s);
    expect(r).toContain("[NAME]");
  });

  it("sanitizes and redacts prospect fields", () => {
    const p = sanitizeAndRedactProspect({
      name: "John Doe",
      email: "john@example.com",
      phone: "+62 812-3456-7890",
      company: "<b>Acme</b>",
      interest: "<script>alert(1)</script> Platinum",
      budget: "€50,000",
    });
    expect(p.name).toBe("[NAME]");
    expect(p.email).toBe("[EMAIL]");
    expect(p.phone).toBe("[PHONE]");
    expect(p.company).toBe("Acme");
    expect((p.interest || "").toLowerCase()).toContain("platinum");
  });
});

