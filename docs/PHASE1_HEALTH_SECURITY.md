Phase 1 — Health, Security, Limits (Implemented)

What’s included
- Health aggregator: `GET /api/health`
  - Checks AI service `/health` and Neon DB `SELECT 1`
  - Optional Redis status: reports `configured` when `REDIS_URL` is set
  - Status: `healthy | degraded | unhealthy`
- Signed fetch + retries for AI calls
  - Helper: `src/lib/ai/secure-fetch.ts`
  - HS256 JWT (30s TTL) via `JWT_SECRET`
  - Retries: 2 attempts (200ms, 800ms) within 1.2s budget
- Rate limiting (best-effort, in-memory) for chat API
  - `src/app/api/chat/generate/route.ts`
  - 10 requests/minute per IP with `Retry-After`
- AI service `/health` hardened
  - `ai/app.py` now returns `uptime` and simple dependency flags

How to test
- Unit tests: `vitest run` (see `src/__tests__/health.test.ts`)
- Health endpoint: `curl http://localhost:3000/api/health`

Env expectations
- `AI_SERVICE_URL` or `AI_API_URL`: base URL for the AI service
- `JWT_SECRET`: secret to sign Next→AI requests (HS256)
- Optional: `REDIS_URL` to surface Redis configured state

Notes
- Rate limiter is memory-based and single-instance; upgrade to Redis later for multi-instance deployments.
- DB check uses Drizzle `select 1`; if Neon is unavailable, status will be `degraded` or `unhealthy`.

