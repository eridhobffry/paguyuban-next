Phase 2 — Resilience & Performance (Implemented)

What’s included (no Redis, minimal changes)

- Circuit breaker for AI calls
  - Open: 5 consecutive failures or >20% failures in 1 minute
  - Half-open after 30s; single probe allowed every 5s
  - Integrated into `src/lib/ai/secure-fetch.ts`
- Request deduplication (10s window)
  - Same method+url+body returns in-flight promise or short-cached response
  - Integrated in `secureFetch`
- In-memory caching (TTL)
  - Event context response: 60s (`/api/ai/data/event-context`)
  - Sponsors list inside event context: 5m
  - Chat context (lastN): 10s (`/api/ai/data/chat-context`)
  - Utility: `src/lib/cache.ts`
- Graceful fallbacks
  - When AI fails/breaker open, `POST /api/chat/generate` serves static FAQs from `/api/admin/knowledge/static` before Gemini local fallback
- DLQ flagging (minimal)
  - On AI failure, inserts a row in `query_performance` with `queryType: 'chat'`, `success: false`, and `errorMessage` containing the failure. (Schema has no metadata field; we record DLQ context in `errorMessage`.)

How to test

- Unit tests: `vitest run`
  - `src/__tests__/secure-fetch.test.ts` covers dedup and breaker short‑circuiting
- Manual checks
  1. Simulate AI down (point `AI_SERVICE_URL` to an invalid host) and call `POST /api/chat/generate`
     - Expect FAQ fallback with `agent: 'faq'`
  2. Restore AI, call quickly twice with same body
     - Verify only one upstream call (check logs) and consistent response
  3. Hit `/api/ai/data/event-context` twice; second should be served quickly (60s response cache)

Design notes

- Kept all state in-process for simplicity; later we can move breaker metrics and caches to Redis without changing call sites.
- `secureFetch` remains the single point for AI calls, avoiding duplication (YAGNI applied).
