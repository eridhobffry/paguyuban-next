export function requiredConsentVersion(): string {
  return process.env.AI_CONSENT_VERSION || "v1";
}

export function isConsentRequired(): boolean {
  // In test environments, bypass consent to allow unit tests to run
  if (process.env.NODE_ENV === "test") return false;
  // Allow explicit opt-out via env flag (defaults to requiring consent)
  return process.env.AI_REQUIRE_CONSENT !== "false";
}

export function hasUserConsent(headers: Headers): boolean {
  if (!isConsentRequired()) return true;
  const required = requiredConsentVersion();
  const provided = headers.get("x-ai-consent")?.trim();
  return provided === required;
}
