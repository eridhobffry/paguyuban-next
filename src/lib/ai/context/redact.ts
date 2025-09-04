export type RedactionCategory = "email" | "phone" | "token" | "secret";

export interface RedactionRules {
  enabled?: Partial<Record<RedactionCategory, boolean>>;
  allowlist?: string[]; // exact string allowlist (e.g., specific emails or numbers)
}

export interface RedactionStats {
  counts: Record<RedactionCategory, number>;
}

export interface RedactionResult {
  text: string;
  stats: RedactionStats;
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
// Basic international-friendly phone pattern (heuristic). Avoids matching short numbers.
const PHONE_RE =
  /(?:(?:\+\d{1,3}[ \-]?)?(?:\(\d{2,4}\)[ \-]?)?\d{2,4}[ \-]?\d{3,4}[ \-]?\d{3,4})/g;
// JWT-like token (header.payload.signature)
const JWT_RE = /\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
// Hex secrets (32+ hex chars)
const HEX_SECRET_RE = /\b[0-9a-fA-F]{32,}\b/g;

function shouldAllow(value: string, allowlist?: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return false;
  return allowlist.includes(value);
}

export function redact(
  input: string,
  rules: RedactionRules = {}
): RedactionResult {
  const enabled: Record<RedactionCategory, boolean> = {
    email: rules.enabled?.email ?? true,
    phone: rules.enabled?.phone ?? true,
    token: rules.enabled?.token ?? true,
    secret: rules.enabled?.secret ?? true,
  };

  const counts: Record<RedactionCategory, number> = {
    email: 0,
    phone: 0,
    token: 0,
    secret: 0,
  };

  let text = input ?? "";

  if (enabled.email) {
    text = text.replace(EMAIL_RE, (m) => {
      if (shouldAllow(m, rules.allowlist)) return m;
      counts.email++;
      return "[REDACTED:email]";
    });
  }

  if (enabled.token) {
    text = text.replace(JWT_RE, (m) => {
      if (shouldAllow(m, rules.allowlist)) return m;
      counts.token++;
      return "[REDACTED:token]";
    });
  }

  if (enabled.secret) {
    text = text.replace(HEX_SECRET_RE, (m) => {
      if (shouldAllow(m, rules.allowlist)) return m;
      counts.secret++;
      return "[REDACTED:secret]";
    });
  }

  if (enabled.phone) {
    text = text.replace(PHONE_RE, (m) => {
      const normalized = m.replace(/[^\d+]/g, "");
      // Guardrail: require at least 7 digits to reduce false positives
      const digits = (normalized.match(/\d/g) || []).length;
      if (digits < 7) return m;
      if (shouldAllow(m, rules.allowlist)) return m;
      counts.phone++;
      return "[REDACTED:phone]";
    });
  }

  return {
    text,
    stats: { counts },
  };
}
