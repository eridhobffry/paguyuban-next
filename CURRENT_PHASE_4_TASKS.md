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

1. Financial (DB-only) — create tables, verify.
2. Financial (read API) — GET revenues/costs.
3. Financial (CRUD API) — seed + POST/PUT/DELETE with zod.
4. Financial (admin UI) — read-only overview + charts, then editor.
5. Admin routing — nested pages for tabs.
6. Speakers (schema + GET) — then CRUD + UI.
7. Agenda (schema + GET) — then CRUD + UI.
8. Sponsors (schema + GET) — then CRUD + UI.
9. Investment Opportunities (schema + GET) — then CRUD + UI.
10. Artists (schema + GET) — then CRUD + UI.
11. Executive Documentation (schema align) — reuse docs infra, add fields if needed.
12. Analytics (schema + GET) — track user behavior and chatbot interactions per logged-in user; then CRUD + UI tab.

We will only move the public site to DB-backed reads after each domain’s admin CRUD proves stable.

### Current Iteration: Task 1 — Create Financial Tables (DB only)

- Create two Neon tables: `financial_revenue_items`, `financial_cost_items` (id, category, amount, notes, sort_order, timestamps).
- Verify on a temporary Neon branch.
- Ask approval to commit migration to main.

Checklist

- [x] Migration prepared on temp branch
- [x] Tables verified on temp branch
- [x] Seeded real financial data on temp branch
- [x] Approval received to commit
- [x] Commit migration to main
- [x] Document outcome here

Outcome

- Tables live on main (`financial_revenue_items`, `financial_cost_items`).
- Seeded with real figures; totals verified (Revenue €1,018,660; Costs €953,474).
- Dropped unused `financial_categories` to prevent drift.

### Risks & Mitigations (for this iteration)

- Accidental schema complexity → Keep columns minimal; add indexes/constraints later.
- Extension availability for UUID → Use `gen_random_uuid()` consistent with existing `documents` table.
- Backward compatibility → No public UI code change in this step.

### Completed After Task 1

- `/api/admin/financial` GET with zod-validated response.
- Admin Financial read-only overview + shadcn charts (donut + bar) with themed tooltips/legends.
- Nested route `/admin/financial` with direct navigation from `/admin`.

### Next Up (smallest steps)

- [x] Admin routing: add `/admin/user` and `/admin/documents` pages; wire tabs to navigate (no jitter).
- [x] Financial CRUD API: add POST/PUT/DELETE under `/api/admin/financial` (minimal zod validation).
- [x] Financial editor UI: selection-based CRUD with dialogs; optimistic updates.
- [x] Evidence field: add explicit `evidence_url` on items and surface in UI; allow multiple links later.
  - Implemented in `FinancialItemDialog` with RHF validation; surfaced in `FinancialOverview` dialog and search.
  - Header controls now include search and page length (10/25/50/100/All) via RHF Select.
  - Table lists are constrained with `max-h-80` and scroll.
  - Removed obsolete `FinancialEditor` component and export.

### UI Shell Migration (Planned)

- After Financial CRUD + editor are stable, integrate shadcn dashboard block for a cohesive admin shell (sidebar, breadcrumbs, layout, theme consistency).

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
