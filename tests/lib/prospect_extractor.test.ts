import { describe, it, expect } from "vitest";
import { extractProspectFromSummary, type Prospect } from "@/lib/prospect";

// Helper to drop nulls for easier assertions
function clean(p: Prospect) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== null && v !== undefined && v !== "") o[k] = v;
  }
  return o as Required<Prospect> | Partial<Prospect>;
}

describe("extractProspectFromSummary", () => {
  it("parses full example with email and phone", () => {
    const summary =
      "Alex Positive from Sunrise Corp submitted a partnership inquiry via the website. They are interested in: Gold sponsorship. Budget indicated: $25k. Contact: alex.pos@example.com · +1-111-111-1111. Source: website. Message: We are excited about partnering and ready to move fast.";

    const p = extractProspectFromSummary(summary);
    const got = clean(p);

    expect(got.name).toBe("Alex Positive");
    expect(got.company).toBe("Sunrise Corp");
    expect(got.interest).toBe("Gold sponsorship");
    expect(got.budget).toBe("$25k");
    expect(got.email).toBe("alex.pos@example.com");
    expect(got.phone).toBe("+1-111-111-1111");
  });

  it("parses when only email is present in contact", () => {
    const summary =
      "Blake from Nova Inc submitted a partnership inquiry via the website. They are interested in: Booth & speaking. Budget indicated: ~IDR 50jt. Contact: blake@nova.co. Source: website.";

    const p = extractProspectFromSummary(summary);
    const got = clean(p);

    expect(got.name).toBe("Blake");
    expect(got.company).toBe("Nova Inc");
    expect(got.interest).toBe("Booth & speaking");
    expect(got.budget).toBe("~IDR 50jt");
    expect(got.email).toBe("blake@nova.co");
    expect(got.phone).toBeUndefined();
  });

  it("parses when only phone is present in contact", () => {
    const summary =
      "Citra from Garuda Ventures submitted a partnership inquiry via the website. They are interested in: Sponsorship. Budget indicated: TBD. Contact: +62 812-3456-7890. Source: website.";

    const p = extractProspectFromSummary(summary);
    const got = clean(p);

    expect(got.name).toBe("Citra");
    expect(got.company).toBe("Garuda Ventures");
    expect(got.interest).toBe("Sponsorship");
    expect(got.budget).toBe("TBD");
    expect(got.email).toBeUndefined();
    expect(got.phone).toBe("+62 812-3456-7890");
  });
});
