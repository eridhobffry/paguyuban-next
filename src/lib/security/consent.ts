export function requiredConsentVersion(): string {
  return process.env.AI_CONSENT_VERSION || "v1";
}

export function hasUserConsent(headers: Headers): boolean {
  const required = requiredConsentVersion();
  const provided = headers.get("x-ai-consent")?.trim();
  return provided === required;
}

