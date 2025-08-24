# Sprint 3 Plan — CMS Extensions & Component Refactoring

## Overview

**Sprint Goal:** Extend CMS capabilities and begin component refactoring to improve maintainability.

**Scope:** Implement Knowledge Overlay CMS, Agenda CMS MVP, Sponsors CMS, and begin component refactoring work. Keep changes incremental and reversible.

**Timeline:** 2-3 weeks
**Priority:** High - These features will significantly enhance admin capabilities and code maintainability.

## Sprint Objectives

### 1) Knowledge Overlay CMS (Highest Priority)

**Goal:** Allow admins to dynamically update chatbot knowledge without redeployment.

**Implementation:**

- **Database:** `knowledge` table with `overlay` JSONB, `updated_at`, optional `is_active`
- **API:** `GET /api/admin/knowledge`, `PUT /api/admin/knowledge` (admin-protected, Zod-validated)
- **Loader:** Add `loadDbKnowledgeOverlay()` with short TTL cache; merge static + file + DB via `deepMerge`
- **Admin UI:** Minimal JSON editor with validation; preview key paths (e.g., `event.dates`, `financials.revenue.total`)
- **Tests:** Unit tests, API route tests, chat integration tests

**Acceptance Criteria:**

- Admin can edit overlay JSON and save to database
- Chat uses updated knowledge within TTL without redeployment
- All tests pass including chat integration

### 2) Agenda CMS MVP

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

### 3) Sponsors CMS

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

### 4) Component Refactoring (Start)

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
