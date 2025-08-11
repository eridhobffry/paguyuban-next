## Phase 4: Content Management Dashboard (Neon + Drizzle)

Small, verifiable iterations: plan → implement the smallest step → test → commit → repeat. Keep public pages stable while progressively moving content to Neon-backed APIs.

### Goals

- Move hardcoded content (financial, speakers, artists, agenda, sponsors, investment opportunities, executive documents) into Neon.
- Provide secure admin CRUD APIs and UI with Zod/RHF/shadcn; keep Drizzle as single source of truth for types.
- Switch public reads to API gradually after each domain’s admin CRUD is stable.
- Add real-time, optimistic UX via TanStack DB + ElectricSQL for domains that benefit from live reads; keep mutations on our API.

### Status Snapshot

- **Done**
  - Financial: Neon tables live; seeded and verified. Admin overview + charts. CRUD API with `evidence_url`. Public endpoint wired to homepage.
  - Routing: `/admin/financial`, `/admin/user`, `/admin/documents`, and revenue/cost detail pages (read + edit/delete) with deep links.
  - Financial detail UI: sorting/search persistence, URL state for selection/sort/search, CRUD in-detail with dialogs, toasts, and optimistic updates.
  - Speakers: table + public GET + admin CRUD API.
  - Artists: table + public GET + admin CRUD API + admin list/detail dialog; seed endpoint; unified Drizzle types and shared zod schemas.
  - Public financial QA: totals match admin; charts update after mutations; cache-busting refresh verified.
  - Public wiring: homepage sections fetch live data
    - `FinancialTransparencySection` → `/api/financial/public` with cache headers and cache-busting, plus BroadcastChannel/Event refresh.
    - `SpeakersSection` → `/api/speakers/public` and `/api/artists/public`; cards deep-link to `/[slug]` when present.
    - `InvestmentOpportunitySection/DocumentsSection` → `/api/documents/public`; restricted docs show lock and open mailto; public docs open file/external link.
  - Analytics foundation (client + server):
    - Client events: `session_start`, `page_view`, `click`, `heartbeat`.
    - Section tracking: `section_visible` with dwell, `scroll_depth`, `exit_position` (IntersectionObserver + passive scroll).
    - Web Vitals: field reporting for INP/LCP/CLS with INP budget alert (>200ms).
    - Server: attaches `userId` to sessions/events when logged-in; per-user/per-IP rate limiting for session starts and event batches.
  - Admin Analytics (initial): `/admin/analytics` page with sessions/events time series and top routes/sections using existing charts; API `/api/admin/analytics` (admin-protected). PII-free; fast on 30d data.
  - Admin Analytics enhancements: range switch (7/30/90d) with server-supported range param; loading skeletons; build and lint green.
  - Accessibility quick pass (WCAG 2.2 alignment):
    - Added skip link, `main` landmark with focus target; global `:focus-visible` ring.
    - Aria labels for icon-only buttons/links in homepage sections.
- **In Progress**
- **Next**
  - Analytics: sessionizer to close stale sessions and compute engagement score.
  - Accessibility: contrast audit across admin lists/dialogs; label/icon sweep; keyboard-only QA in admin pages.
- **Later (Roadmap)**
  - Reports (CSV/XLSX) and Excel ingestion (template, upload, staging, promote) with Gemini-assisted insights.
  - Admin UI shell migration to shadcn dashboard block.
  - Analytics: schema, admin GET, and basic charts.

### Architecture

- **Database (Neon)**: normalized tables; start simple; add metadata later.
- **Backend (Next.js)**: admin-protected CRUD under `/api/admin/*` with `zod` validation, DB via Drizzle.
- **Frontend (Admin)**: `/admin`-scoped pages; RHF + shadcn; optimistic UI with toasts; replace manual refresh with live queries where applicable.
- **Types**: Drizzle-derived types as the single source of truth; generate Zod schemas from Drizzle definitions for API validation and FE parsing.
- **Real-time Reads**: ElectricSQL shape proxy endpoint in app (auth-enforced) + TanStack DB collections on the client for live queries and optimistic mutations. Mutations stay on our API.
- **Caching**: Keep public endpoints cacheable (ISR/edge) with explicit busting; admin reads live where needed.

---

## Workstreams

### Real-time Sync (TanStack DB + ElectricSQL)

- **Rationale**: End-to-end reactivity without maintaining WebSocket infra; ElectricSQL streams Postgres changes to clients via HTTP long-polling; TanStack DB provides optimistic mutations and live queries while keeping our writes on the existing API. Reference: TanStack DB with Sync (Neon blog).

- **Pilot Scope**: `speakers` (narrow, low risk). Rollout to `artists` → `financial` (admin first) → `documents` reads if beneficial.

- **Plan (incremental, feature-flagged)**

  1. Dependencies: `@tanstack/react-db`, `@tanstack/electric-db-collection`.
  2. Proxy endpoint: create `src/app/api/realtime/shape/route.ts` to forward whitelisted query params to ElectricSQL, inject credentials from env, and enforce auth + row-level filters. Remove `content-encoding`/`content-length` headers in proxy response.
  3. Schemas: derive Zod schemas from Drizzle (`InferSelectModel` → Zod generator or maintained schema). Keep FE/BE types aligned with Drizzle.
  4. Client collections: define `speakersCollection` with `createCollection(electricCollectionOptions(...))`, `getKey`, and mutation callbacks (`onInsert/onUpdate/onDelete`) that call our existing `/api/admin/speakers` endpoints and return txids (timestamp suffices initially).
  5. UI integration: change `useSpeakersAdmin` reads to `useLiveQuery` against `speakersCollection`; keep current hook behind `NEXT_PUBLIC_EXPERIMENT_SPEAKERS_SYNC` for rollback.
  6. Rollout: observe error rates and UX, then repeat for `artists`. For `financial`, start with admin pages; public charts can remain cached with existing refresh, or adopt live queries on client after pilot.
  7. Performance & backoff: ensure shape query selects necessary columns only; paginate if needed.
  8. Security: proxy must validate caller auth (Stack Auth), sanitize/whitelist params (`live`, `handle`, `offset`, `cursor`, `where`), enforce table allow-list; do not expose ElectricSQL secrets client-side.
  9. Observability: add logging around proxy failures and client mutation errors; toasts in UI; incrementally add metrics.
  10. Documentation: notes for dev setup (env vars, feature flag), fallback mode, and rollback instructions.

- **Acceptance (pilot)**

  - Admin `speakers` list reflects cross-tab changes within 1–2s without manual refresh.
  - Create/update/delete is optimistic; rolls back on server error; toasts shown.
  - Toggling the feature flag reverts to legacy fetch flow without errors.

- **Pilot Decision (today - 2025-08-11)**
  - Status: plan, do not implement yet.
  - Rationale: missing infrastructure and credentials:
    - No shape proxy route exists (`src/app/api/realtime/shape/route.ts`).
    - ElectricSQL service not provisioned; no `ELECTRIC_URL`/token configured.
    - Neon projects found, but logical replication is currently disabled; required for Electric sync.
  - Minimal checklist to proceed (gated by `NEXT_PUBLIC_EXPERIMENT_SPEAKERS_SYNC=1`):
    1. Provision ElectricSQL project and create shape API token.
    2. Enable logical replication on Neon and ensure appropriate permissions.
    3. Add env: `ELECTRIC_URL`, `ELECTRIC_TOKEN`, `ALLOWED_TABLES=speakers`.
    4. Implement proxy endpoint `src/app/api/realtime/shape/route.ts`:
       - Validate Stack Auth session, whitelist params (`live`, `handle`, `offset`, `cursor`, `where`).
       - Enforce table allow-list; strip `content-encoding`/`content-length` on relay.
    5. FE: add deps `@tanstack/react-db` and `@tanstack/electric-db-collection`.
    6. FE: create `src/lib/realtime/speakersCollection.ts` with `createCollection(electricCollectionOptions(...))`, `getKey: (r) => r.id`.
       - Mutations: in `onInsert/onUpdate/onDelete`, call existing `/api/admin/speakers` routes; return timestamp as txid.
    7. Hook: in `useSpeakersAdmin`, if flag enabled use `useLiveQuery(speakersCollection)`; otherwise keep current fetch.
    8. QA: cross-tab update within 1–2s; optimistic rollback on error; feature flag toggle restores legacy flow.
  - Rollback: flip env flag off; no code paths retained in production.

### Financial

- **Current**

  - Tables: `financial_revenue_items`, `financial_cost_items` live and seeded; UUID via `gen_random_uuid()`.
  - Admin: overview + charts (donut/bar); selection-based editor with dialogs and `evidence_url` field; search + page length controls; scrollable tables.
  - Routing: `/admin/financial` plus read-only detail pages for revenue and cost; overview actions link to details.
  - Public: `/api/financial/public` wired to `FinancialTransparencySection`.
  - Cleanup: dropped `financial_categories` to prevent drift.

- **Next (Prioritized)**

  1. Revenue detail UI

  - [x] Item panel shows `category`, `amount`, `notes`, `evidence_url` (clickable), `created_at`, `updated_at`.
  - [x] Sorting by `category`, `amount`, `sort_order`; search persisted via query param.
  - [x] Row actions: Edit, Delete; top-level Add.

- [x] Deep links: `/admin/financial/revenue/[id]` opens selected item.

  - Acceptance: evidence opens in new tab; totals/charts recompute after mutations; browser nav keeps state.

  2. Cost detail UI (mirror revenue)

  - [x] Same capabilities; deep link `/admin/financial/cost/[id]`.

  3. CRUD wiring

  - [x] Reuse `FinancialItemDialog` for add/edit (pre-filled on edit).
  - [x] Toasts added; fallback to refresh.
  - [x] Optimistic update (create/update/delete) with rollback on error.
  - [x] Keep Drizzle-derived types the single source of truth.

4. Backend readiness

- [x] Ensure GET/POST/PUT include `evidenceUrl`.
  - [x] Optional: GET-by-id endpoint `/api/admin/financial/item?id=...&itemType=...`.

5. Routing & state

- [x] Persist search/sort to URL; selecting a row updates URL without full-page nav.

6. QA

- [x] Numbers consistent across overview, detail pages, and charts.
- [x] Access control enforced in middleware and APIs.
- [x] Mobile layout usable (horizontal scroll, readable panel).

- **Public Alignment**
  - [x] Endpoint exists and homepage wired.
  - [x] Client refresh listener wired (BroadcastChannel + event) and cache-busting fetch.
  - [x] QA totals vs admin; ensure charts update after mutations.
  - [ ] Optional (post-pilot): switch public charts to live queries gated by a flag, or keep current cached model and rely on periodic refresh.

### Speakers

- **Current**

  - Table, public GET `/api/speakers/public` (ordered, cached), admin CRUD API with `speakerType` enum.

- **Done**

  - Admin UI list + read-only detail dialog.
  - Create/edit with image URL field and validation; delete with confirm + toasts.
  - Search, sort, and row-limit controls on list. Sidebar integration.
  - Public filters: `q`, `slug`, `tag`, `type` supported on `/api/speakers/public`; homepage section wired and cards deep-link to `/speakers/[slug]` when present.

- **Next**
  - [x] Image upload via signed client tokens (`/api/admin/upload/handle`) with fallback to server upload; store returned URL; URL-based path still supported.
  - [x] Blob cleanup: ref-counted delete on PUT/DELETE via shared util; registry-based references for scalability.
  - [x] Richer `bio/tags/slug` retained; public optional filters added (`q`, `slug`, `tag`, `type`).
  - [x] Deep links: `/speakers/[slug]` with ISR; homepage cards link when `slug` present.
  - [x] Admin-side optional filters by `speakerType` and company on `/admin/speakers`.
  - Optional (pilot target): live queries via TanStack DB + ElectricSQL; optimistic admin mutations.
  - Pilot readiness (gated):
    - Pre-reqs: ElectricSQL project + token, Neon logical replication enabled, proxy route in place.
    - Scope: list reads only for now; mutations remain on existing admin API.
    - Flag: `NEXT_PUBLIC_EXPERIMENT_SPEAKERS_SYNC=1`.

### Artists

- **Current**

  - Table, public GET, admin CRUD API, admin list + detail dialog, seed endpoint, homepage wired, unified types via Drizzle (`InferSelectModel`) and shared zod schemas.

- **Done**

  - Blob upload via signed client tokens (`/api/admin/upload/handle`) with fallback to server upload; store returned URL in `imageUrl`.
  - Ref-counted blob cleanup on PUT/DELETE using shared utilities and registry.
  - Admin requests include credentials consistently; UI uses `useMediaUpload("artists")` with temp commit/discard.
  - Public filters parity aligned with speakers (`q`, `slug`, `tag`).
  - Public deep links `/artists/[slug]` live with ISR; homepage section wired via `SpeakersSection` featured artists grid.

- **Next**
  - Feature enrichments parity (optional deeper UI filters, tagging UX improvements).
  - Extend registry if adding new media fields later.

### Executive Documents

- **Current**

  - Admin API `/api/admin/documents` supports file upload, URL analysis, and manual entry. Uses Gemini to generate `title`, `description`, `preview`, `pages`, `type`, `icon`, and `suggestedRestricted`. Fields stored include `file_url` or `external_url`, `restricted`, and `ai_generated`.
  - Public API `/api/documents/public` returns transformed documents for the site.
  - Admin UI includes upload tabs and library with view/edit/delete.
  - Vercel Blob upload route `/api/admin/upload` and `useMediaUpload("documents")` exist; documents UI not wired to this flow yet.

- **Done**

  - [x] Drizzle schema for `documents` defined (`src/lib/db/schemas/documents.ts`) with optional `marketingHighlights`.
  - [x] Public endpoint reads via Drizzle and transforms output shape; filters non-restricted only and sets cache headers.
  - [x] Links (file or external) open in a new tab from admin and public views.
  - [x] Public types derived from Drizzle (`PublicDocument` in `src/types/documents.ts`).
  - [x] Homepage section wired (`InvestmentOpportunitySection/DocumentsSection`) with skeleton states; restricted docs show lock and Request Access CTA.

- **Next (Prioritized)**

  - [x] Switch admin documents API to Drizzle with Zod-validated payloads; align BE/FE types via `InferSelectModel`.
  - [x] Wire storage: use `useMediaUpload("documents")` + `/api/admin/upload` to store files in Vercel Blob; pass returned URL to admin create; remove in-endpoint file reading. (Create flow wired; edit flow supports Replace File.)
  - [x] Register `documents.fileUrl` in shared blob registry and perform ref-counted cleanup on PUT/DELETE.
  - [x] Migrate admin UI components to Drizzle-derived types (`DocumentRow`/`NewDocumentRow` from `src/types/documents.ts`); deprecate `src/types/admin.ts` `Document`.
  - [x] Optional: persist `marketingHighlights` JSON from AI analysis; render in admin; expose on public.
  - [x] Optional: gated live updates scaffold for admin documents (env `NEXT_PUBLIC_EXPERIMENT_DOCUMENTS_SYNC=1` enables polling); public reads remain cached.

- **Acceptance**
  - Admin can upload or link a document; Gemini summary saved (title, description, preview, pages); link opens; access control respected.
  - Types are Drizzle-derived and shared across BE/FE.

### Admin Routing

- **Current**

  - Nested pages: `/admin/financial`, `/admin/user`, `/admin/documents`, `/admin/financial/revenue`, `/admin/financial/cost`; overview links to details; `[id]` deep-link item pages for revenue and cost are implemented; no jitter on tab nav.

- **Next**
  - Deep links for selected financial items; persist search/sort/selection in URL; mirror patterns for speakers/artists later.
  - Optional: use route-aware query keys for live queries to keep filters stable across navigation.

### UI Shell Migration (Later)

- Integrate shadcn dashboard layout (sidebar, breadcrumbs, layout, theme consistency) after financial CRUD is stable.

---

## Reports, Excel Ingestion, and Insights (Roadmap)

### Exports

- [ ] CSV export of filtered/sorted financial items with totals.
- [ ] XLSX export with sheets: `Revenue`, `Costs`, `Summary` (totals + pivots by category).
- [ ] Backend export endpoint with validated params; streaming for large datasets.
- Acceptance: exported numbers match on-screen totals; opens in Sheets/Excel without warnings.

### Excel Upload & Alignment

- [ ] Downloadable `.xlsx` template with `category, amount, notes, evidence_url, sort_order`.
- [ ] Admin upload → server parse → validate → preview differences.
- [ ] Staging tables (`financial_revenue_items_staging`, `financial_cost_items_staging`) then "Promote" upserts to main.
- [ ] Keep original file as evidence; store normalized CSV snapshot for provenance.
- Acceptance: preview shows totals; promoting updates dashboard immediately.

### Gemini-Assisted Analysis (Advisory)

- [ ] Summarize trends/outliers/misclassifications on sanitized CSV.
- [ ] Persist analysis JSON with provenance; show in "AI Insights" panel in `/admin/financial`.
- [ ] Cache/rehydrate for identical inputs; never auto-apply.
- Acceptance: SLA ≤5s cached, ≤20s first-run; include caveats/provenance.

### Risks & Mitigations

- Excel quirks (locale, formulas, merged cells) → restrict to first sheet, typed columns, numeric validation.
- Row identity for upsert → start with manual confirm/replace; add stable keys later if needed.
  - Dataset size → stream exports and paginate previews.

---

## Analytics (Planning)

- **Goal**: 360° insight into user behavior to drive personalized UX while respecting privacy.

- **What to capture**

  - Page & session: `page_view`, `session_start/end`, referrer, UTM, device, country, viewport.
  - Engagement by section: `section_visible` (IntersectionObserver), dwell_ms, scroll_depth, exit_position.
  - Interaction: `click` (sanitized selector/role/text), `form_submit`, `video_play`, `dialog_open`.
  - Heartbeat & dwell: activity heartbeat (e.g., 15s) paused on idle/blur.
  - Chat: `chat_message` (role, tokens, latency), `chat_summary` per session (topics, intents, sentiment).
  - Derived: `engagement_score`, `top_sections`, `predicted_next_action` (heuristics first).

- **Schema (Drizzle + Neon)**

  - [x] `analytics_sessions`: id, user_id?, started_at, ended_at, route_first, referrer, utm, device, country, engagement_score.
  - [x] `analytics_events`: id, session_id, user_id?, route, type, section?, element?, metadata JSON, created_at.
  - [x] `analytics_section_durations`: id, session_id, section, dwell_ms, created_at.
  - [x] `chatbot_logs`: id, session_id, user_id?, role, message, tokens, created_at.
  - [x] `chatbot_summaries`: id, session_id, summary, topics JSON, sentiment, created_at.

- **Backend**

  - [x] `/api/analytics/track` with Zod-validated payload, CORS, and batching support.
  - [ ] Rate limiting (per-IP/session) for public endpoint.
  - [ ] Sessionizer to close stale sessions, compute `engagement_score`, and rollups.
  - [ ] Chat summarizer (async via Gemini) on session end; persist `chatbot_summaries`.
  - [ ] Optional: server-sent events or ElectricSQL-backed reads for dashboard views.

- **Frontend**

  - [x] Tiny `analyticsClient` with `session_start`, `page_view` on route changes, global `click`, and `heartbeat` (15s), batching enabled.
  - [ ] Section observer (`section_visible`, dwell_ms, scroll_depth, exit_position).
  - [ ] Configurable sample rate; disabled in dev (currently gated by `NEXT_PUBLIC_ENABLE_ANALYTICS`).
  - [ ] Optional GA4 or `@vercel/analytics` alongside custom events.

- **Admin UI (initial)**

  - [ ] Time series: sessions, events, avg engagement, bounce.
  - [ ] Top routes/sections, scroll depth distribution, funnels.
  - [ ] Chat: volume, topics cloud, sentiment, per-session summaries.

- **Privacy & retention**

  - [ ] No PII; sanitize/ redact fields; honor Do Not Track / consent.
  - [ ] Retention: raw events 90d, aggregates 12m; opt-out mechanism.

- **Acceptance (first cut)**

  - [ ] Events captured without jank; section dwell stable within ±10% across reloads.
  - [ ] Charts render within 1s on 30d data; no PII leaks; chat summaries within 20s of session end.

- **Small next steps (incremental)**
  1. Schema + MCP: sessions, events, section_durations, chatbot_logs, chatbot_summaries.
  2. Backend: `/api/analytics/track` + sessionizer; minimal aggregations.
  3. Frontend: `analyticsClient` with page_view, click, section observer, heartbeat.
  4. Chat: log messages; async Gemini summaries per session.

### Neon MCP Alignment (Migrations & Types)

- Use Neon MCP to prepare and verify DB changes on a temp branch, then commit upon approval.
  - [ ] Prepare migration: add Drizzle `documents` table (and optional `marketing_highlights` JSON) and update APIs to use Drizzle.
  - [x] Prepare migration: create analytics tables: `analytics_sessions`, `analytics_events`, `analytics_section_durations`, `chatbot_logs`, `chatbot_summaries`.
  - [ ] Verify on temp branch; update FE types via Drizzle `InferSelectModel` and zod schemas; then commit.
- Branching: favor Neon branching for risky schema changes; keep prod traffic isolated; instant restore if needed.
- Types pipeline: any schema change must update Drizzle models, regenerate Zod schemas, and propagate FE/BE imports.

### Data Client Strategy (React Query vs TanStack DB)

Two complementary paths; choose per domain:

- React Query (no real-time requirement):

  - Trigger: shared cache/invalidation across pages, pagination, background refetch, coherence without live updates.
  - Steps:
    1. Wrap app with `QueryClientProvider`.
    2. Convert `useFinancial` to `useQuery` + `useMutation` with optimistic updates and invalidation.
    3. Replace manual event bus with query invalidation.
    4. Roll out to Speakers/Artists/Documents where live updates are not required.

- TanStack DB + ElectricSQL (real-time reads):
  - Trigger: multi-user coherence, instant UI, background tasks updating Postgres, cross-tab/device updates.
  - Steps: follow the Real-time Sync workstream (pilot → rollout), keep mutations via API.
  - Coexistence: It’s fine for some domains to use React Query and others to use TanStack DB collections.

---

## Decisions & Notes

- Dropped `financial_categories` to prevent schema drift.
- Keep Drizzle-derived types as the single source of truth for frontend types.
- Public endpoints remain open (no auth) for homepage fetches; access control enforced in admin routes and middleware.
- Real-time adoption will be gated by feature flags per domain and rolled out after a successful pilot.
- Blob storage pattern: server uploads via `@vercel/blob.put`, UI helper `useMediaUpload`, and shared cleanup util with registry-based ref counting. Extend registry for new domains (agenda, documents, site logos). Best-effort deletes; non-blocking.

## UX 2025 Alignment (current status)

- Performance and feedback
  - **Optimistic CRUD with toasts** across admin (financial, speakers, artists) and non-blocking UI.
  - **Skeleton/loading states** in `DocumentsSection`; homepage sections avoid layout shifts.
  - **Core Web Vitals focus**: target INP < 200ms, good LCP/CLS budgets; next step: add field metrics and regression alerts.
- Accessibility
  - Semantics and keyboard nav largely follow component library; next step: audit WCAG 2.2 AA (landmarks, focus rings, contrast) and fix deltas.
- Personalization and clarity
  - Clear information hierarchy, progressive disclosure in admin dialogs; dark theme supported.
- Collaboration and real-time
  - Cross-tab refresh via BroadcastChannel for financial/documents; real-time pilot queued (feature-flagged) for speakers list.

## Evidence & Links

- Financial master sheet (restricted; do not fetch programmatically): `https://docs.google.com/spreadsheets/d/1bZFvjBk7AkfyMAIfUy5P0EjiqDgoFxa_oipObHjExv8/edit?usp=sharing`
- Admin can attach links/files as evidence; later Gemini will summarize/validate with provenance.
- TanStack DB with Sync – the future of real-time UI (Neon blog): `https://neon.com/blog/tanstack-db-and-electricsql`
