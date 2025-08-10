## Phase 4: Content Management Dashboard (Neon + Drizzle)

Small, verifiable iterations: plan → implement the smallest step → test → commit → repeat. Keep public pages stable while progressively moving content to Neon-backed APIs.

### Goals

- Move hardcoded content (financial, speakers, artists, agenda, sponsors, investment opportunities, executive documents) into Neon.
- Provide secure admin CRUD APIs and UI with Zod/RHF/shadcn; keep Drizzle as single source of truth for types.
- Switch public reads to API gradually after each domain’s admin CRUD is stable.

### Status Snapshot

- **Done**
  - Financial: Neon tables live; seeded and verified. Admin overview + charts. CRUD API with `evidence_url`. Public endpoint wired to homepage.
  - Routing: `/admin/financial`, `/admin/user`, `/admin/documents`, and read-only detail pages for revenue and cost; overview “View” links to details.
  - Speakers: table + public GET + admin CRUD API.
  - Artists: table + public GET + admin CRUD API + admin list/detail dialog; seed endpoint; unified Drizzle types and shared zod schemas.
- **In Progress**
  - Financial detail pages: full fields and deep links done; sorting/search persistence, CRUD actions in-detail pages, and URL state still pending.
- **Next**
  - Public financial QA: verify homepage totals match admin and charts update after mutations; optional ISR/client refresh.
  - Speakers admin UI: list + detail dialog (read-only first), then create/edit with image.
  - URL state: persist search/sort and selection without full navigation.
- **Later (Roadmap)**
  - Reports (CSV/XLSX) and Excel ingestion (template, upload, staging, promote) with Gemini-assisted insights.
  - Admin UI shell migration to shadcn dashboard block.
  - Analytics: schema, admin GET, and basic charts.

### Architecture

- **Database (Neon)**: normalized tables; start simple; add metadata later.
- **Backend (Next.js)**: admin-protected CRUD under `/api/admin/*` with `zod` validation, DB via `src/lib/db.ts`.
- **Frontend (Admin)**: `/admin`-scoped pages; RHF + shadcn; optimistic UI with toasts; live recompute for financials.

---

## Workstreams

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
  - [ ] Sorting by `category`, `amount`, `sort_order`; search persisted via query param.
  - [ ] Row actions: Edit, Delete; top-level Add.

- [x] Deep links: `/admin/financial/revenue/[id]` opens selected item.

  - Acceptance: evidence opens in new tab; totals/charts recompute after mutations; browser nav keeps state.

  2. Cost detail UI (mirror revenue)

  - [x] Same capabilities; deep link `/admin/financial/cost/[id]`.

  3. CRUD wiring

  - [x] Reuse `FinancialItemDialog` for add/edit (pre-filled on edit).
  - [ ] Toasts + optimistic update where safe; fallback to refresh.
  - [x] Keep Drizzle-derived types the single source of truth.

4. Backend readiness

- [x] Ensure GET/POST/PUT include `evidenceUrl`.
  - [x] Optional: GET-by-id endpoint `/api/admin/financial/item?id=...&itemType=...`.

5. Routing & state

- [ ] Persist search/sort to URL; selecting a row updates URL without full-page nav.

6. QA

- [ ] Numbers consistent across overview, detail pages, and charts.
- [x] Access control enforced in middleware and APIs.
- [ ] Mobile layout usable (horizontal scroll, readable panel).

- **Public Alignment**
  - [x] Endpoint exists and homepage wired.
  - [ ] QA totals vs admin; ensure charts update after mutations.
  - [ ] Optional ISR/revalidate or client refresh listener.

### Speakers

- **Current**

  - Table, public GET `/api/speakers/public` (ordered, cached), admin CRUD API with `speakerType` enum.

- **Next**
  - [ ] Admin UI list + detail dialog (read-only first), then create/edit with image field.
  - Planned enrichments: image upload (signed URL), richer `bio/tags/slug` for deep links (`/speakers/[slug]`), homepage dialog on card click; RHF + shadcn + toasts; search/sort by name/company.

### Artists

- **Current**

  - Table, public GET, admin CRUD API, admin list + detail dialog, seed endpoint, homepage wired, unified types via Drizzle (`InferSelectModel`) and shared zod schemas.

- **Next**
  - Feature parity with Speakers enrichments.
  - Storage plan: Phase A `image_url` (URL-based); Phase B Vercel Blob upload and store URL.

### Executive Documents

- **Current**

  - Admin API `/api/admin/documents` supports file upload, URL analysis, and manual entry. Uses Gemini to generate `title`, `description`, `preview`, `pages`, `type`, `icon`, and `suggestedRestricted`. Fields stored include `file_url` or `external_url`, `restricted`, and `ai_generated`.
  - Public API `/api/documents/public` returns transformed documents for the site.
  - Admin UI includes upload tabs and library with view/edit/delete.

- **Next (Prioritized)**

  - [ ] Switch documents to Drizzle schema and generated types (BE/FE alignment via `InferSelectModel`).
  - [x] Ensure public endpoint filters to non-restricted only and is cached appropriately.
  - [x] Open links (file or external) in new tab from admin and public views.
  - [x] Public endpoint uses Drizzle schema/types for reads.
  - [ ] Migrate admin documents API from raw SQL helpers to Drizzle to unify BE/FE types.
  - [ ] Optional: persist `marketingHighlights` as JSON for richer UI summaries.
  - [ ] Storage: move file uploads to Vercel Blob; store returned URL in DB; keep `external_url` path supported.

- **Acceptance**
  - Admin can upload or link a document; Gemini summary saved (title, description, preview, pages); link opens; access control respected.
  - Types are Drizzle-derived and shared across BE/FE.

### Admin Routing

- **Current**

  - Nested pages: `/admin/financial`, `/admin/user`, `/admin/documents`, `/admin/financial/revenue`, `/admin/financial/cost`; overview links to details; `[id]` deep-link item pages for revenue and cost are implemented; no jitter on tab nav.

- **Next**
  - Deep links for selected financial items; persist search/sort/selection in URL; mirror patterns for speakers/artists later.

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

  - [ ] `analytics_sessions`: id, user_id?, started_at, ended_at, route_first, referrer, utm, device, country, engagement_score.
  - [ ] `analytics_events`: id, session_id, user_id?, route, type, section?, element?, metadata JSON, created_at.
  - [ ] `analytics_section_durations`: id, session_id, section, dwell_ms, created_at.
  - [ ] `chatbot_logs`: id, session_id, user_id?, role, message, tokens, created_at.
  - [ ] `chatbot_summaries`: id, session_id, summary, topics JSON, sentiment, created_at.

- **Backend**

  - [ ] `/api/analytics/track` with zod-validated payload, CORS, rate limiting; batching support.
  - [ ] Sessionizer to close stale sessions, compute `engagement_score`, and rollups.
  - [ ] Chat summarizer (async via Gemini) on session end; persist `chatbot_summaries`.

- **Frontend**

  - [ ] Tiny `analyticsClient` for `page_view`, global `click`, section observer, heartbeat; batching with backoff.
  - [ ] Route-change hook to log page views and referrer/UTM once per session.
  - [ ] Configurable sample rate; disabled in dev.
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
  - [ ] Prepare migration: create analytics tables: `analytics_sessions`, `analytics_events`, `analytics_section_durations`, `chatbot_logs`, `chatbot_summaries`.
  - [ ] Verify on temp branch; update FE types via Drizzle `InferSelectModel` and zod schemas; then commit.

---

## Decisions & Notes

- Dropped `financial_categories` to prevent schema drift.
- Keep Drizzle-derived types as the single source of truth for frontend types.
- Public endpoints remain open (no auth) for homepage fetches; access control enforced in admin routes and middleware.

## Evidence & Links

- Financial master sheet (restricted; do not fetch programmatically): `https://docs.google.com/spreadsheets/d/1bZFvjBk7AkfyMAIfUy5P0EjiqDgoFxa_oipObHjExv8/edit?usp=sharing`
- Admin can attach links/files as evidence; later Gemini will summarize/validate with provenance.
