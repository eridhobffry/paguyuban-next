## Phase 4: Content Management Dashboard — Incremental Plan (Neon-aligned)

This file tracks small, verifiable steps to implement Phase 4. We will proceed in tiny iterations: plan → implement one smallest task → test → ask to commit → repeat.

### Goals

- Move hardcoded content (financial, speakers, agenda, sponsors, investment opportunities, artists, executive documents) into Neon DB.
- Provide secure Admin CRUD APIs and UI with validation (Zod, React Hook Form, shadcn UI).
- Keep existing public pages stable; progressively switch reads to API-backed data.

### Architecture Breakdown

- Database (Neon): normalized tables per domain with simple columns first; add optional metadata later.
- Backend (Next.js API routes): admin-protected CRUD endpoints under `/api/admin/*`, using `zod` request validation and `src/lib/db.ts` Pool.
- Frontend Admin: extend `/admin` with tabs and forms per domain; wire to APIs; optimistic UI with toasts; live recompute totals for financials.

### Iteration Map (Small Wins)

1. Financial (read) — create tables only, verify, no UI changes yet.
2. Financial (admin API GET) — return items; no writes yet.
3. Financial (seed + POST/PUT/DELETE) — minimal CRUD with zod.
4. Financial (admin UI) — basic table editor with totals; save to DB.
5. Speakers (schema + GET) — then CRUD + UI.
6. Agenda (schema + GET) — then CRUD + UI.
7. Sponsors (schema + GET) — then CRUD + UI.
8. Investment Opportunities (schema + GET) — then CRUD + UI.
9. Artists (schema + GET) — then CRUD + UI.
10. Executive Documentation (schema align) — reuse existing docs infra, add fields if needed.
11. Analytics (schema + GET) — track user behavior and chatbot interactions per logged-in user; then CRUD + UI tab.

We will only move the public site to DB-backed reads after each domain’s admin CRUD proves stable.

### Current Iteration: Task 1 — Create Financial Tables (DB only)

- Create two Neon tables: `financial_revenue_items`, `financial_cost_items` (id, category, amount, notes, sort_order, timestamps).
- Verify on a temporary Neon branch.
- Ask approval to commit migration to main.

Checklist

- [x] Migration prepared on temp branch
- [x] Tables verified on temp branch
- [x] Seeded real financial data on temp branch
- [ ] Approval received to commit
- [ ] Commit migration to main
- [ ] Document outcome here

### Risks & Mitigations (for this iteration)

- Accidental schema complexity → Keep columns minimal; add indexes/constraints later.
- Extension availability for UUID → Use `gen_random_uuid()` consistent with existing `documents` table.
- Backward compatibility → No public UI code change in this step.

### Next (after approval)

- Implement `/api/admin/financial` GET to read both tables and return `{ revenues: [], costs: [] }`.
- Add basic zod schemas for API responses.

### Admin Routing Improvements (Planned)

- Move from a single `/admin` route to nested routes for state persistence and deep links:
  - `/admin/user`
  - `/admin/financial`
  - `/admin/financial/revenue`
  - `/admin/artist/[id]`
  - Similar patterns for speakers, agenda, sponsors, investment-opportunity, analytics
- Benefits: refresh-safe tabs, direct links for detail views, easier future editing pages.

Next steps for routing:

- [x] Create `/admin/financial` page and redirect Financial tab via onClick (no useEffect) to avoid jitter
- [ ] Add `/admin/user` page and route User Management there
- [ ] Add `/admin/documents` page and route Document Management there
- [ ] Plan `/admin/financial/revenue` detail page scaffolding (read-only first)

### Next Plan Session

- Define admin Analytics tab scope (metrics, events, per-user chatbot logs, retention window).
- Draft minimal analytics schema (events, user_id, route, action, metadata, created_at) and chatbot logs (user_id, message, role, tokens, created_at).
- Sequence: analytics schema → GET (admin) → basic charts UI → progressive enrichment.

### Future Schema Enhancements (Optional, Non-Blocking)

- Optional presentational fields: `color`, `percentage` for server-side control.
- Multi-period/versioning: `fiscal_year` and `scenario` (enum: `draft`, `approved`) to support forecasting and versions.
- Provenance & audit: `source` (text) and `updated_by` (user id).
- Indexes: current `sort_order` index is enough; if periodization is added, consider composite `(fiscal_year, sort_order)`.

### Decisions (History)

- Dropped unused table `financial_categories` to prevent schema drift. If controlled categories are needed later, reintroduce with `fiscal_year`/`scenario` and foreign keys.

### Evidence & External Sources (for AI Analysis)

- Financial master sheet (restricted, do not fetch programmatically yet): `https://docs.google.com/spreadsheets/d/1bZFvjBk7AkfyMAIfUy5P0EjiqDgoFxa_oipObHjExv8/edit?usp=sharing`
- Plan: Admin can attach files/links as evidence; Gemini API will summarize/validate and store structured insights (title, source, preview, pages, executive summary) alongside provenance.
  - for financials docs in financial tabs, we can also anlyze or convert it as csv first then to JSON so we can use it as a source of truth for the financials and do deep analysis on it.
