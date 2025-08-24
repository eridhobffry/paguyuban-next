# 📚 Paguyuban Messe 2026 - Unified Project Documentation

## 🎯 Quick Navigation

### 📊 Current Status (Sprint 2: 95% Complete)

- **Status**: Ready for final QA → Production deployment
- **Next**: Execute manual tests → Start Sprint 3
- **Priority**: Knowledge Overlay CMS implementation

### 📋 Documentation Index

- **[Current Sprint Status](#-current-sprint-status)** - Sprint 2 completion details
- **[Sprint 3 Plan](#-sprint-3-plan)** - Next sprint objectives
- **[Component Refactoring](#-component-refactoring-plan)** - Technical debt reduction
- **[Manual QA Guide](#-manual-qa-testing)** - Final Sprint 2 requirements
- **[Project History](#-project-archive)** - Completed work and achievements

---

## 🚀 Executive Summary

This unified documentation provides a complete overview of the Paguyuban Messe 2026 website project. The project has successfully transitioned from initial development to a production-ready state with comprehensive admin functionality.

**Current State**: Website is stable, feature-rich, and production-ready for sponsor outreach with complete authentication and CMS foundations.

**Next Phase**: Sprint 3 focuses on extending CMS capabilities and component refactoring for long-term maintainability.

---

## 📊 Current Sprint Status

### Sprint 2: Admin Test Coverage & QA Hardening

**Status: 95% Complete** | **Branch: `sprint-2-admin-tests`** | **Ready for Final QA**

#### ✅ Completed Objectives (95%)

1. **Admin Zod Schema Validation Tests** ✅

   - 42 comprehensive unit tests for all admin data schemas
   - Covers validation logic for artists, speakers, sponsors, documents, and financial data
   - Tests edge cases including empty objects, null values, and invalid UUIDs

2. **Admin API Route Testing** ✅

   - 25 security and functionality tests for all admin endpoints
   - Covers authentication, authorization, CRUD operations, and error handling
   - Tests GET, POST, PUT, DELETE operations with proper validation

3. **Admin Form Validation Testing** ✅

   - 28 tests for the Sponsor creation/edit form
   - Covers React Hook Form integration, UI validation, and form submission workflows
   - Includes accessibility testing and error message validation

4. **QA Hardening** ✅
   - Expanded Playwright E2E test suite to cover downloads, anchor scrolling, and lead capture forms
   - Added mobile testing support with `mobile-chrome` and `mobile-safari` projects
   - Implemented `@smoke` tagged tests for cross-browser/mobile smoke testing
   - Refined CI pipeline with dedicated desktop and mobile smoke jobs

#### 🔄 Remaining Task (5%)

**Manual QA Pass** - Execute test cases from `MANUAL_TESTING_GUIDE.md`:

- Site Header Navigation
- Theme Toggle
- Logo Click Navigation
- Mobile Responsiveness
- Document Downloads
- Accessibility Basics
- Chat Widget (if available)

#### 📈 Sprint 2 Achievements

- **67+ automated test cases** across multiple layers
- **100% admin endpoints secured** with proper authentication
- **Comprehensive error handling** and performance validation
- **Well-structured test architecture** for future development

#### 🎯 Sprint 2 Completion Requirements

**To complete Sprint 2:**

1. Execute all manual test cases from `MANUAL_TESTING_GUIDE.md`
2. Verify no critical issues found during manual testing
3. All automated tests continue to pass (67+ test cases)
4. CI pipeline shows green status

**After completion:**

- Merge `sprint-2-admin-tests` branch into main
- Deploy enhanced admin functionality to production
- Begin Sprint 3 planning

---

## 🚀 Sprint 3 Plan — CMS Extensions & Component Refactoring

### Overview

**Sprint Goal:** Extend CMS capabilities and begin component refactoring to improve maintainability.  
**Timeline:** 2-3 weeks | **Priority:** High-impact features for admin capabilities and code quality.

### Sprint Objectives

#### 1) Knowledge Overlay CMS (Highest Priority)

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

#### 2) Agenda CMS MVP

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

#### 3) Sponsors CMS

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

#### 4) Component Refactoring (Start)

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

---

## 🔧 Component Refactoring Plan

### Overview

**Goal:** Break down oversized components (>200 LOC) into smaller, maintainable parts.  
**Priority:** High - Essential for long-term code quality and developer productivity.

### Key Principles

- Keep components ≤ 200 LOC where practical
- Prefer composition over monolithic components
- Extract complex logic into hooks and utilities
- Align types with database schema and `@types` directory
- Maintain UI parity while improving code organization

### Priority Components (Sprint 3)

#### 1) Admin Analytics Page (696 LOC) - Highest Priority

**Current:** `src/app/admin/analytics/page.tsx`  
**Split into:** `AnalyticsHeader`, `KpiCards`, `TrendsChart`, `BreakdownTables`, `RecommendationsPanel`, `SummariesPanel`  
**Data Layer:** Move to `src/hooks/useAdminData.ts`  
**Impact:** Major improvement in admin dashboard maintainability

#### 2) ROI Calculator Section (905 LOC)

**Current:** `src/components/sections/ROICalculatorSection.tsx`  
**Split into:** `CalculatorForm`, `AssumptionsPanel`, `ResultsSummary`, `SensitivityChart`, `DownloadPanel`  
**Logic:** Extract math calculations to `src/lib/financial.ts`  
**Impact:** Complex business logic becomes testable and reusable

#### 3) Document Upload Component (480 LOC)

**Current:** `src/components/admin/DocumentUpload.tsx`  
**Split into:** `UploadDropzone`, `QueuedItem`, `UploadProgressList`, `UploadControls`, `ErrorBanner`  
**Hooks:** Upload logic to `src/hooks/useUpload.ts`  
**Impact:** File upload functionality becomes reusable across admin sections

#### 4) Edit Document Modal (387 LOC)

**Current:** `src/components/admin/EditDocumentModal.tsx`  
**Split into:** `EditDocumentModalShell`, `DocumentForm`, `MetadataFields`, `PreviewPane`, `FooterActions`  
**Types:** Align with `src/types/validation.ts` and DB schemas  
**Impact:** Modal becomes more flexible and testable

### Additional Components in Backlog

- `src/components/sections/FinancialTransparencySection.tsx` (615 LOC)
- `src/components/sections/ChatAssistantSection.tsx` (552 LOC)
- `src/components/sections/TechnologyPlatformSection.tsx` (525 LOC)
- `src/app/admin/speakers/page.tsx` (267 LOC)
- Various admin dialog components (200-250 LOC each)

### Implementation Strategy

1. **Start with High-Impact:** Begin with admin analytics page (696 LOC)
2. **Incremental Delivery:** Small, focused PRs with visible improvements
3. **Type Safety:** Ensure all components use Drizzle-generated types
4. **Testing:** Validate that splits don't break existing functionality
5. **Documentation:** Update component relationships and dependencies

---

## 📋 Manual QA Testing Guide

### Sprint 2 Completion Requirements

**Final Manual Test Cases:**

- ✅ Site Header Navigation
- ✅ Theme Toggle
- ✅ Logo Click Navigation
- ✅ Mobile Responsiveness
- ✅ Document Downloads
- ✅ Accessibility Basics
- 🔄 Chat Widget (if available)

**Test Execution Steps:**

1. Start development server (`npm run dev`)
2. Execute each test case from `MANUAL_TESTING_GUIDE.md`
3. Document any issues found
4. Verify all automated tests still pass
5. Confirm CI pipeline status

**Completion Criteria:**

- All manual test cases executed
- No critical issues found
- Automated test suite passes (67+ tests)
- CI shows green status

---

## 📚 Project Archive & Historical Record

### Key Achievements Summary

#### Phase 1: Critical Data Alignment ✅

- Corrected revenue from €615K to €1,018K
- Updated all sponsorship tiers to match internal documents
- Fixed ROI calculator methodology

#### Phase 2: Content Enhancement ✅

- Added €7.32B bilateral trade data with credible sources
- Updated audience projections (6,800+ attendees)
- Enhanced methodology with government-backed data

#### Phase 3: Authentication & User Management ✅

- Complete JWT-based authentication system
- Role-based access control (super_admin, admin, member)
- Admin dashboard with full user lifecycle management

#### Phase 4: CMS Foundations ✅

- Dynamic content management for Financial, Speakers, Artists, Documents
- Analytics tracking and reporting
- Admin UI with optimistic updates and real-time data

#### Sprint 2: Testing & Quality Assurance ✅ (95% Complete)

- 67+ automated test cases across unit, integration, and E2E
- Comprehensive security validation
- Mobile and cross-browser testing support
- Ready for final manual QA and production deployment

### Technical Implementation Highlights

- **Database:** PostgreSQL with Neon + Drizzle ORM
- **Authentication:** JWT tokens with bcrypt hashing
- **Testing:** Vitest + React Testing Library + Playwright
- **Architecture:** Next.js App Router with TypeScript
- **Security:** Zod validation, SQL injection prevention, XSS protection

### Future Work Backlog

#### High Priority (Sprint 3)

- **Knowledge Overlay CMS:** Dynamic chatbot knowledge management
- **Agenda CMS MVP:** Event agenda with speaker assignments
- **Sponsors CMS:** Complete dynamic sponsor logo management
- **Component Refactoring:** Break down oversized components (696 LOC → 200 LOC target)

#### Medium Priority

- Advanced admin features (rich text editors, export capabilities)
- Analytics V2 (scheduled reporting, engagement metrics)
- Accessibility improvements and audits

#### Low Priority

- Enhanced UI/UX features
- Performance optimizations
- Additional integrations

---

## 🎯 Quick Reference Guide

### Current Status

- **Sprint 2:** 95% Complete (needs manual QA)
- **Website:** Production-ready for sponsor outreach
- **CMS:** Functional for key content types
- **Testing:** Comprehensive automated test suite

### Key Contacts & Access

- **Admin Email:** eridhobffry@gmail.com
- **Admin Password:** Aabbcc1!
- **Role:** Super Admin (full system access)

### Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

### File Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── admin/     # Admin dashboard pages
│   ├── api/       # API routes
│   └── (public)/  # Public pages
├── components/    # Reusable UI components
│   ├── admin/     # Admin-specific components
│   ├── sections/  # Homepage sections
│   └── ui/        # Base UI components
├── lib/           # Business logic and utilities
├── types/         # TypeScript type definitions
└── hooks/         # Custom React hooks
```

### Sprint 3 Planning

- **Start:** After Sprint 2 completion
- **Focus:** CMS Extensions + Component Refactoring
- **Timeline:** 2-3 weeks
- **Priority:** Knowledge Overlay CMS → Agenda CMS → Component Refactoring

---

## Completed Implementation Phases

This section archives the major completed phases and sprints of the project.

### ✅ Phase 1: Critical Data Alignment (Completed Aug 3, 2025)

This phase corrected all critical financial and sponsorship data on the website to align with internal documentation.

- **Financial Data:** Corrected total revenue from €615,660 to **€1,018,660**.
- **Sponsorship Tiers:** Updated all pricing tiers to match official rates (e.g., Title Sponsor from €75k to €120k).
- **ROI Calculator:** Refactored to focus on sponsor benefits and value realization, supported by a credible methodology.

### ✅ Phase 2: Content Enhancement (Completed Aug 3, 2025)

This phase enriched the website with credible data and context to build trust with potential sponsors.

- **Trade Context:** Added section with €7.32B bilateral trade data from official sources.
- **Audience Projections:** Updated to reflect 6,800+ total attendees (online and offline).
- **Strategic Sectors:** Detailed 6 key collaboration sectors with market potential data.

### ✅ Phase 3: Access Control & User Management (Completed Aug 4, 2025)

This phase secured the website and implemented a robust system for managing user access.

- **Authentication:** Implemented a full JWT-based authentication system.
- **Admin Dashboard:** Created a dashboard for approving, rejecting, revoking, restoring, and deleting users.
- **Role-Based Access Control (RBAC):** Introduced `super_admin`, `admin`, and `member` roles to protect critical actions.
- **Security:** Ensured secure password hashing (bcrypt), route protection via middleware, and transaction safety.

### ✅ Phase 4: Foundational CMS & Analytics (Completed Aug 11, 2025)

This phase migrated static site content into a dynamic, database-backed CMS and introduced analytics.

- **CMS Implemented For:**
  - **Financials:** Full CRUD for revenue/costs, with charts and optimistic UI updates.
  - **Speakers & Artists:** Full CRUD with image upload handling and public-facing APIs.
  - **Executive Documents:** Admin upload and management with Gemini-assisted field extraction.
- **Analytics (First Cut):** Deployed client-side tracking for key user interactions (page views, clicks, dwell time) and built an initial admin analytics dashboard.
- **Accessibility:** Implemented foundational accessibility features (skip links, landmarks, focus rings).

### ✅ Sprint: Homepage MVP Finalization

This sprint focused on making the public-facing homepage fully interactive and functional.

- **CTA & Anchor Wiring:** All call-to-action buttons and anchor links on the homepage were wired to their correct destinations (`/request-access?type=...`, section IDs, etc.).
- **Public Assets:** All required public documents (PDFs), images (OG/Twitter), and a static calendar event (`.ics`) were created and linked.
- **Lead Capture:** The `/request-access` page was enhanced to handle different lead types based on a URL query parameter, streamlining the lead flow into the existing admin dashboard.

### ✅ Sprint: Admin Test Coverage & QA Hardening

This sprint significantly increased the quality and stability of the admin panel and the project as a whole.

- **QA Hardening:** Expanded Playwright E2E test suite to cover downloads, anchor scrolling, and lead capture forms. Established CI jobs for automated desktop and mobile smoke tests.
- **Admin Schema Tests:** Added 42 unit tests to validate Zod schemas for all admin data types.
- **Admin API Route Tests:** Added 25 tests to secure and validate all admin API endpoints (GET, POST, PUT, DELETE), covering authentication, authorization, and error handling.
- **Admin Form Tests:** Wrote 28 tests for the Sponsor creation/edit form, ensuring UI validation and form submission workflows are robust.

## Project Backlog & Future Work

This section outlines the remaining high-priority features and initiatives planned for future sprints.

### ⏳ CMS Feature Extensions

- **Knowledge Overlay CMS:** The highest priority next feature. This will allow admins to dynamically update the knowledge base for the on-site chatbot via a JSON editor in the admin panel, without requiring a redeployment.
- **Agenda CMS:** Implement admin CRUD for the event agenda (days, sessions, speaker assignments).
- **Sponsors CMS (Phase 2):** While a basic CMS exists, the next phase involves adding a logo upload flow and fully wiring it to the public-facing `SponsorsSection`.
- **Investment Opportunity CMS:** Migrate the static "Investment Opportunity" section to be database-driven.

### ⏳ Technical Debt & Refactoring

- **Component Refactoring:** A large number of frontend components (especially in the admin panel and homepage sections) have grown too large. A comprehensive refactoring plan is documented in `NEXT_SPRINT_COMPONENT_REFACTOR_PLAN.md` and is slated to begin in the next sprint.
- **Advanced Admin Features:** Future enhancements include rich text editors, content preview functionality, and data export capabilities.

### ⏳ Analytics & Reporting V2

- **Scheduled Reporting:** Implement a cron job to sessionize analytics data and surface higher-level insights (e.g., engagement trends, conversion funnels).
- **Admin Accessibility Audit:** Conduct a full QA pass on the admin panel for accessibility issues (contrast, labels, keyboard navigation).

## Technical Implementation Notes (Historical)

- **File Organization:** The project follows a standard Next.js structure with clear separation for API routes (`/api`), UI components (`/components`), libraries (`/lib`), and database logic (`/db`).
- **Authentication:** JWTs are stored in HTTP-only cookies with a 7-day expiration. Passwords are hashed with bcrypt.
- **Database:** The project uses PostgreSQL via Neon with Drizzle ORM for type-safe queries.
- **Testing:** The testing stack includes Vitest for unit tests and Playwright for E2E tests.

---

---

---
