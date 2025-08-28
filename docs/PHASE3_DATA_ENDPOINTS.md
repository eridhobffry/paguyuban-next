# Phase 3 — AI Data Endpoints and Neon Mappings

This document summarizes the AI data context endpoints, their query params, the data they return, and the Neon database tables they touch. Implementations aim to be minimal, well-typed, cached where useful, and easy to test.

## See also

- Stability & testing notes for Phase 3: [PHASE3_AI_CONTEXT_STABILITY.md](./PHASE3_AI_CONTEXT_STABILITY.md)

## Endpoints

### 1) GET /api/ai/data/chat-context

- **Params**
  - `sessionId` (uuid, required)
  - `intent` (string, optional)
  - `limit` (number, optional, default 20, max 50)
- **Returns**
  - `logs`: recent chat logs for the session (chronological)
  - `prospect`: best-effort prospect info using layered heuristics
    - A: `userId` or `sessionId` → `partnership_applications.source`
    - B: email found in messages → lookup by email
    - C: fallback to session `chatbot_summaries` → extract via text parsing
  - `sentiment`: "positive" | "negative" | "neutral" (simple keyword-based)
  - `metadata`: counts, sessionId, intent
- **Tables used**
  - `chatbot_logs` (sessionId, userId, role, message, tokens, created_at)
  - `partnership_applications` (name, email, company, phone, interest, budget, source, created_at)
  - `chatbot_summaries` (sessionId, summary, created_at)
- **Caching**
  - Logs cached 10s per `{sessionId}:{limit}`

### 2) GET /api/ai/data/event-context

- **Params**
  - `intent` (string, optional)
  - `include` (string, optional): comma-separated list of sections to include
    - Supported: `sponsors`, `tiers`, `sponsor_logos`, `artists`, `speakers`
    - Default: `sponsors,tiers`
- **Returns**
  - `sponsors`: public sponsor list (nulls normalized to undefined)
  - `tiers`: public sponsor tiers plus `remaining = max(0, available - sold)`
  - `availability`: quick summary by common tier names (title, platinum, gold, silver, bronze)
  - `artists` (when requested)
  - `speakers` (when requested)
  - `sponsor_logos` (when requested): multiple logos per sponsor (label, url, dims)
  - `pricing_context` (when `intent=pricing|business_analysis`): coarse business figures
- **Tables used**
  - `sponsors` (id, name, url, logo_url, tags, sort_order, updated_at)
  - `sponsor_tiers` (id, name, slug, description, price, available, sold, features, sort_order, updated_at)
  - `sponsor_logos` (id, sponsor_id, label, url, width, height, sort_order)
  - `artists` (varies)
  - `speakers` (varies)
- **Caching**
  - `sponsors`: 5 minutes
  - `tiers`: 5 minutes
  - `sponsor_logos`: 5 minutes
  - Whole response: 60s `s-maxage`, 30s `stale-while-revalidate`

### 3) GET /api/ai/data/analytics-context

- **Params**
  - `sessionId` (string, optional)
  - `userId` (string, optional)
  - `intent` (string, optional)
  - `timeRange` (string, optional; implementation-dependent)
- **Returns**
  - Core analytics events, performance data, behavior metrics
  - Personalization block when `intent=personalization`
  - Sessions: currently behind feature flag (see below)
- **Feature flag**
  - `AI_INCLUDE_SESSIONS`
    - Off by default in tests; keeps implementation minimal and avoids heavy mocks
    - When toggled on for production, fetching `analytics_sessions` can be implemented safely
- **Tables used** (varies by implementation)
  - `analytics_events`
  - `analytics_sessions` (optional, behind flag)
  - `chatbot_logs`, `chatbot_summaries` (for cross-context correlations, optional)
  - `queries` (for query performance summaries, optional)

## Neon Tables (Drizzle Schemas)

- `chatbot_logs`
  - `id`, `session_id`, `user_id`, `role`, `message`, `tokens`, `created_at`
- `chatbot_summaries`
  - `session_id`, `summary`, `created_at`
- `partnership_applications`
  - `name`, `email`, `company`, `phone`, `interest`, `budget`, `source`, `created_at`
- `sponsors`
  - `id`, `name`, `url`, `logo_url`, `slug`, `tier_id`, `tags[]`, `sort_order`, timestamps
- `sponsor_tiers`
  - `id`, `name`, `slug`, `description`, `price(bigint→number)`, `available`, `sold`, `color`, `features(jsonb)`, `sort_order`, timestamps
- `sponsor_logos`
  - `id`, `sponsor_id`, `label`, `url`, `width`, `height`, `sort_order`, timestamps
- `artists` / `speakers`
  - Public presentation fields, image URLs, slugs, social links (varies)
- `analytics_events` / `analytics_sessions`
  - Event telemetry and session metadata (implementation-dependent)
- `queries`
  - Query metrics/records (implementation-dependent)

## Notes

- Nulls from the DB are normalized to `undefined` in public DTOs where appropriate.
- Keep implementations incremental and test-friendly. Prefer small, composable changes.
- Use `getCached()` for inexpensive, short-lived caches that improve endpoint responsiveness.
