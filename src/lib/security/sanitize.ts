// Minimal, fast sanitization and PII redaction utilities

export function sanitizeInput(text: string, maxLen = 4096): string {
  if (!text) return "";
  // Normalize and strip control characters except common whitespace
  let t = text.normalize("NFKC");
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  // Strip HTML tags (very lightweight) and script/style blocks
  t = t.replace(/<\/(?:script|style)>/gi, "");
  t = t.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  t = t.replace(/<[^>]+>/g, "");
  // Collapse excessive whitespace
  t = t.replace(/[\t\f\v]+/g, " ").replace(/\s{2,}/g, " ");
  t = t.trim();
  if (t.length > maxLen) t = t.slice(0, maxLen);
  return t;
}

export function redactPII(text: string): string {
  if (!text) return text;
  let t = text;
  // Email addresses
  t = t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]");
  // IPv4 addresses
  t = t.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]");
  // Basic international phone numbers (+.. or digits with separators)
  t = t.replace(/\+?\d[\d\s().-]{6,}\d/g, "[PHONE]");
  return t;
}

export function sanitizeOutput(text: string, maxLen = 8192): string {
  if (!text) return "";
  let t = text;
  // Guard against system prompt leakage or env hints
  const leakPatterns = [
    /BEGIN SYSTEM PROMPT/i,
    /END SYSTEM PROMPT/i,
    /GEMINI_API_KEY|OPENAI_API_KEY|JWT_SECRET|DATABASE_URL/i,
  ];
  if (leakPatterns.some((re) => re.test(t))) {
    return "Sorry, I can’t share that information. Please try another question.";
  }
  if (t.length > maxLen) t = t.slice(0, maxLen);
  return t;
}

// Optional heuristic name redaction (disabled by default due to FP risk)
export function redactNames(text: string): string {
  if (!text) return text;
  // Very simple: redact patterns like "John Doe" (two capitalized words)
  // Avoid redacting ALL-CAPS (brands) and short words
  const re = /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g;
  return text.replace(re, (m) => "[NAME]");
}

export type ProspectLike = Partial<{
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  interest: string | null;
  budget: string | null;
}>;

export function sanitizeAndRedactProspect(p: ProspectLike): ProspectLike {
  const redNames = process.env.AI_REDACT_NAMES === "1";
  const clean = (v: string | null | undefined) =>
    v ? sanitizeInput(v) : v ?? null;
  const redact = (v: string | null | undefined) => {
    if (!v) return v ?? null;
    let t = redactPII(v);
    if (redNames) t = redactNames(t);
    return t;
  };
  return {
    name: redact(clean(p.name ?? null)) ?? null,
    email: redact(clean(p.email ?? null)) ?? null,
    phone: redact(clean(p.phone ?? null)) ?? null,
    company: clean(p.company ?? null),
    interest: clean(p.interest ?? null),
    budget: clean(p.budget ?? null),
  };
}
