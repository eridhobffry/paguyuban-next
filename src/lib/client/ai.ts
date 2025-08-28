// Client-only helpers to manage AI consent and attach the header
export function setAiConsent(version = "v1") {
  try {
    localStorage.setItem("aiConsentVersion", version);
    localStorage.setItem("aiConsentTimestamp", String(Date.now()));
  } catch {}
}

export function getAiConsent(): string | null {
  try {
    return localStorage.getItem("aiConsentVersion");
  } catch {
    return null;
  }
}

export async function aiFetch(
  input: RequestInfo | URL,
  init: (RequestInit & { requireConsent?: boolean }) = {}
) {
  const headers = new Headers(init.headers || {});
  if (init.requireConsent !== false) {
    let consent = "v1";
    try {
      consent = localStorage.getItem("aiConsentVersion") || consent;
    } catch {}
    headers.set("x-ai-consent", consent);
  }
  return fetch(input, { ...init, headers });
}

