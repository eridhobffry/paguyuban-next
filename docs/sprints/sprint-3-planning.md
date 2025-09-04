# Sprint 3 Plan — CMS Extensions & Component Refactoring

## Overview

**Sprint Goal:** Extend CMS capabilities and begin component refactoring to improve maintainability.

**Scope:** Migrate AI from Gemini to a local runtime, implement Knowledge Overlay CMS, Agenda CMS MVP, Sponsors CMS, and begin component refactoring work. Keep changes incremental and reversible.

**Timeline:** 2-3 weeks
**Priority:** High - These features will significantly enhance admin capabilities and code maintainability.

## Sprint Objectives

### 1) AI Platform Migration (Replace Gemini with Local) — Highest Priority

**Goal:** Eliminate external AI costs by removing Gemini usage and switching to a local AI runtime under the `ai/` directory.

**Implementation:**

- **Client Replacement:** Replace `src/lib/ai/gemini-client.ts` with a local AI client that preserves the existing interface (`generateText`, `extractJsonObject`).
- **Routes & Services:** Update all imports to use the local client (`admin/analytics/chat/recommend`, `admin/partnership/recommend`, `analytics/chat/summary`, `src/lib/document-analyzer.ts`, `src/lib/gemini.ts`).
- **Models/Runtime:** Configure a lightweight local model and ensure deterministic JSON output for Zod validation. Use the `ai/` directory for the runner.
- **Validation:** Keep JSON-mode + Zod validation via `src/lib/ai/schemas.ts`.
- **Config/CI:** Remove Gemini secrets from `.env*` and CI. Provide a provider-toggle if needed.
- **Testing:** Update unit/integration tests to use/mocks of the local client.
- **Docs:** Update `docs/GEMINI_USAGE.md` to note deprecation and local flow.

**Acceptance Criteria:**

- No external Gemini calls remain
- All tests pass with the local AI client
- Feature parity maintained (intent detection, summaries, recommendations)
- Zero AI cost in dev/CI

### 2) Knowledge Overlay CMS (High Priority)

**Goal:** Allow admins to dynamically update chatbot knowledge without redeployment.

**Implementation:**

- **Database & Migration:** Define schema and create Drizzle migration (`drizzle/`, Neon) for `knowledge` table storing overlay JSON and metadata.
- **CRUD API Routes:** Admin-protected, Zod-validated `GET /api/admin/knowledge`, `PUT /api/admin/knowledge`, plus upload if needed.
- **Admin UI:** Forms built with `react-hook-form` + Zod; JSON editor with validation and previews for key paths (e.g., `event.dates`, `financials.revenue.total`).
- **Loader Integration:** Implement precedence and deep-merge logic in `src/lib/knowledge/loader.ts` with short TTL cache across static/file/DB overlays.
- **Tests:** Unit + E2E tests for CRUD flows, loader behavior, and chat overlay consumption.
- **Docs & Plans:** Update `CURRENT_SPRINT_PLAN.md`, `NEXT_SPRINT_PLAN.md`, and this plan upon completion.

**Acceptance Criteria:**

- Admin can edit overlay JSON and save to database
- Chat uses updated knowledge within TTL without redeployment
- All tests pass including chat integration

### 3) Agenda CMS MVP

**Goal:** Enable admin management of event agenda with speaker assignments.

**Implementation:**

- **Database:** Use existing tables: `agenda_days`, `sessions`, `session_speakers`
- **Admin CRUD:** Create admin interface for days and sessions management
- **Speaker Linking:** Manage speaker assignments via `session_speakers` table
- **Public API:** `/api/agenda/public` endpoint
- **Feature Flag:** Behind flag until fully tested

**Acceptance Criteria:**

- Admin can create/edit/delete agenda items and speaker assignments
- Public API returns properly formatted agenda data
- Feature flag controls visibility

### 4) Sponsors CMS

**Goal:** Complete dynamic sponsor logo management system.

**Implementation:**

- **Database:** `sponsors` table with name, tier, logoUrl, link
- **Admin CRUD:** Full page under `src/app/admin/sponsors/page.tsx`
- **Public API:** `/api/sponsors/public` endpoint
- **File Upload:** Logo upload with proper validation
- **Integration:** Wire `SponsorsSection.tsx` to use dynamic data

**Acceptance Criteria:**

- Admin can upload/manage sponsor logos
- Public section displays logos when enabled
- No broken image requests
- Proper fallback handling

### 5) Component Refactoring (Start)

**Goal:** Break down oversized components to improve maintainability.

**Implementation:**

- **Priority Components:** Start with `src/app/admin/analytics/page.tsx` (696 LOC)
- **Split Strategy:** Extract into `AnalyticsHeader`, `KpiCards`, `TrendsChart`, `BreakdownTables`, `RecommendationsPanel`, `SummariesPanel`
- **Data Layer:** Move data derivations to `src/hooks/useAdminData.ts`
- **Pattern:** Follow established component organization patterns

**Acceptance Criteria:**

- No runtime behavior changes
- All lint and typecheck pass
- Components ≤ 200 LOC where practical
- Clear separation of concerns
