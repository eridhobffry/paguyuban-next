Phase 5 — Safety & Privacy (Implemented)

Overview
- Input sanitation: Normalize, strip HTML/scripts, remove control chars, cap length (4KB default)
- PII redaction: Replace emails, phone numbers, and IPs before sending to AI
- Output validation: Guard against leakage markers and overlong outputs
- Minimal footprint: Applied to AI-facing routes; no schema changes

What’s included
- Utilities: `src/lib/security/sanitize.ts`
  - `sanitizeInput(text, maxLen)`
  - `redactPII(text)`
  - `sanitizeOutput(text, maxLen)`
- Applied to routes:
  - `POST /api/chat/generate`
    - Sanitize user `message`; redact before AI call; sanitize output
  - `POST /api/ai/intent/resolve`
    - Sanitize `query`; redact before intent-analyze AI call
  - `POST /api/ai/respond`
    - Sanitize `query`; redact before response AI call; sanitize output

Not enforced yet (next steps)
-- Server-side storage of consentVersion; advanced output JSON schema checks where needed

Consent UX (added)
- Server gate: `x-ai-consent` header required in `POST /api/chat/generate` and `POST /api/ai/respond`
  - Required version: `AI_CONSENT_VERSION` env (default: `v1`)
  - Error when missing/mismatch: `403` `{ error: "consent_required", requiredVersion: "v1" }`
- Frontend guidance:
  - On first AI interaction, show a modal summarizing privacy terms and store `{ consentVersion: 'v1', timestamp }` locally
  - On submit, set header for requests: `x-ai-consent: v1`
- Utility: `src/lib/security/consent.ts` (`requiredConsentVersion`, `hasUserConsent`)

Client Helper (tiny)
Use this small helper on the client to automatically attach the consent header to AI requests. It reads `consentVersion` from `localStorage` (falling back to `v1`). You can drop this into any client file (e.g., `src/lib/client/aiFetch.ts`) or inline in components.

```ts
// Client-only utility (Next.js/React)
export function setAiConsent(version = 'v1') {
  try {
    localStorage.setItem('aiConsentVersion', version);
    localStorage.setItem('aiConsentTimestamp', String(Date.now()));
  } catch {}
}

export async function aiFetch(
  input: RequestInfo | URL,
  init: (RequestInit & { requireConsent?: boolean }) = {}
) {
  const headers = new Headers(init.headers || {});
  if (init.requireConsent !== false) {
    // Attach consent header by default
    let consent = 'v1';
    try {
      consent = localStorage.getItem('aiConsentVersion') || consent;
    } catch {}
    headers.set('x-ai-consent', consent);
  }
  return fetch(input, { ...init, headers });
}

// Example usage in a component/action
// await aiFetch('/api/chat/generate', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ message: 'Kapan acara?', assistantType: 'ucup' }),
// });
```

Tip: Call `setAiConsent('v1')` after the user accepts your consent modal. If the server responds with `403 consent_required`, show the modal again and retry the request after setting the header.

How to test
- Unit tests: `vitest run`
  - `src/__tests__/security.test.ts` covers input sanitize, PII redaction, and leakage guard
- Manual checks:
  1) Send messages with HTML/script tags → ensure cleaned inputs
  2) Include email/phone/IP in query → observe redaction in AI payloads/logs
  3) Simulate AI returning sensitive text → output replaced with safe message

Design notes
- Kept fast regex-based sanitization for server routes (no DOM required)
- PII patterns are conservative; extend as needed
- All changes preserve UX with minimal disruption and can be expanded later
