## Next Sprint: Component Chunking & Refactor Plan

Scope: Break down oversized Admin and Homepage components (>200 LOC) into smaller, composable parts for maintainability, sustainability, and readability. This plan feeds into the next sprint tracked in `NEXT_SPRINT_PLAN.md`.

Principles

- Keep components ≤ 200 LOC where practical; prefer composition over monoliths.
- Centralize types and align with database schema and `@types` directory [[memory:5746214]] [[memory:5746207]].
- Prefer Drizzle-generated types to ensure frontend ↔ DB parity [[memory:5548502]].
- Extract complex logic into hooks and pure utilities; keep UI components presentational.
- Ship in small, incremental edits with visible improvements each PR [[memory:5672868]] [[memory:5548494]].

Global Deliverables

- Create/extend feature folders with `index.ts` re-exports (admin analytics, admin documents, ROI section).
- Centralize calculation/formatting helpers in `src/lib/*`.
- Ensure component-level stories or minimal examples (optional) to validate splits.

Definition of Done

- Files split into named subcomponents/hooks per plan below.
- Types reference shared `@types` or Drizzle-generated schema.
- No change in runtime behavior; UI parity validated manually.
- Lint and typecheck pass.

Backlog (Prioritized)

1. src/app/admin/analytics/page.tsx (≈696 LOC)

- Split: `AnalyticsHeader`, `KpiCards`, `TrendsChart`, `BreakdownTables`, `RecommendationsPanel`, `SummariesPanel`.
- Move data derivations/selectors to `src/hooks/useAdminData.ts`.
- Deliverables: new components, updated page composition, memoized selectors.
- Estimate: 1.5–2 days.

2. src/components/admin/DocumentUpload.tsx (≈480)

- Split: `UploadDropzone`, `QueuedItem`, `UploadProgressList`, `UploadControls`, `ErrorBanner`.
- Ensure upload logic lives in `src/hooks/useUpload.ts`.
- Estimate: 1 day.

3. src/components/sections/ROICalculatorSection.tsx (≈905)

- Split: `CalculatorForm`, `AssumptionsPanel`, `ResultsSummary`, `SensitivityChart`, `DownloadPanel`.
- Move pure math to `src/lib/financial.ts`; align types with Drizzle [[memory:5548502]].
- Estimate: 2 days.

4. src/components/admin/EditDocumentModal.tsx (≈387)

- Split: `EditDocumentModalShell`, `DocumentForm`, `MetadataFields`, `PreviewPane`, `FooterActions`.
- Reference validation in `src/types/validation.ts` and DB-aligned types [[memory:5746214]] [[memory:5746207]].
- Estimate: 1 day.

5. src/components/sections/FinancialTransparencySection.tsx (≈615)

- Split: `RevenueChart`, `CostChart`, `MethodologyNotes`, `DownloadCsvButton`.
- Extract shared chart utils to `src/lib/analytics/*`.
- Estimate: 1 day.

6. src/components/sections/ChatAssistantSection.tsx (≈552)

- Split: `PromptInput`, `SuggestionChips`, `MessageList`, `AssistantActions`.
- Abstract chat API calls to `src/hooks/useChatAssistant.ts`.
- Estimate: 1 day.

7. src/components/sections/TechnologyPlatformSection.tsx (≈525)

- Split: `FeatureGrid`, `ArchitectureOverview`, `CTASection`.
- Estimate: 0.75 day.

8. src/components/sections/ScheduleSection.tsx (≈422)

- Split: `ScheduleFilters`, `Timeline`, `SessionCard`, `DetailsDrawer`.
- Estimate: 1 day.

9. src/components/sections/CtaSection.tsx (≈391)

- Split: `CtaHeader`, `CtaButtons`, `SupportingPoints`.
- Estimate: 0.5 day.

10. src/components/sections/TradeContextSection.tsx (≈377)

- Split: `StatsGrid`, `Narrative`, `MapBlock`.
- Estimate: 0.75 day.

11. src/components/sections/SponsorsSection.tsx (≈366)

- Split: `TierCards`, `LogoWall`, `SponsorCta`.
- Estimate: 0.75 day.

12. src/components/sections/CulturalWorkshopsSection.tsx (≈349)

- Split: `WorkshopGrid`, `WorkshopCard`, `RegistrationModal`.
- Estimate: 0.75 day.

13. src/components/sections/InvestmentOpportunitySection/DocumentsSection.tsx (≈302)

- Split: `DocumentsList`, `DocumentItem`, `DownloadAll`.
- Estimate: 0.5 day.

14. src/components/sections/HeroSection.tsx (≈301)

- Split: `HeroCopy`, `HeroMedia`, `HeroActions`.
- Estimate: 0.5 day.

15. src/components/admin/FinancialList.tsx (≈290)

- Split: `FinancialFilters`, `FinancialItemRow`, `SummaryBar`, `PaginationControls`.
- Keep data ops in `src/hooks/useFinancial.ts`.
- Estimate: 0.75 day.

16. src/components/sections/SpeakersSection.tsx (≈278)

- Split: `SpeakerFilters`, `SpeakersGrid`, `SpeakerCard`.
- Estimate: 0.5 day.

17. src/app/admin/speakers/page.tsx (≈267)

- Split: `SpeakersHeader`, `SpeakersTable`, `Toolbar`.
- Estimate: 0.75 day.

18. src/components/admin/SpeakersDialog.tsx (≈248)

- Split: `SpeakerForm`, `RoleSelector`, `AvatarUploader`.
- Estimate: 0.5 day.

19. src/components/admin/FinancialOverview.tsx (≈245)

- Split: `OverviewHeader`, `OverviewCharts`, `Legend`, `DownloadButtons`.
- Estimate: 0.5 day.

20. src/components/admin/ArtistsDialog.tsx (≈238)

- Split: `ArtistForm`, `GenreSelector`, `ImageUploader`.
- Estimate: 0.5 day.

21. src/components/sections/AboutSection.tsx (≈228)

- Split: `Mission`, `Milestones`, `TeamGrid`.
- Estimate: 0.5 day.

22. src/components/admin/DocumentLibrary.tsx (≈227)

- Split: `SearchBar`, `DocumentGrid`, `DocumentCard`, `SidePreview`.
- Estimate: 0.5 day.

Cross-Cutting Tasks

- Types alignment pass across edited files (use Drizzle types or `@types/*`) [[memory:5746214]] [[memory:5746207]] [[memory:5548502]].
- Create `src/lib/format.ts` and `src/lib/number.ts` for shared formatting.
- Introduce minimal `src/components/common/*` primitives if duplication appears (e.g., `SectionHeader`, `EmptyState`).

Milestones (suggested)

- Week 1: Items 1–4 (admin-heavy), start item 5.
- Week 2: Items 5–10 (homepage sections), start item 11.
- Week 3: Items 11–18.
- Week 4: Items 19–22 + cross-cutting cleanup.

Tracking Checklist

- [ ] 1. Admin Analytics page
- [ ] 2. Admin Document Upload
- [ ] 3. ROI Calculator section
- [ ] 4. Edit Document Modal
- [ ] 5. Financial Transparency section
- [ ] 6. Chat Assistant section
- [ ] 7. Technology Platform section
- [ ] 8. Schedule section
- [ ] 9. CTA section
- [ ] 10. Trade Context section
- [ ] 11. Sponsors section
- [ ] 12. Cultural Workshops section
- [ ] 13. Investment Opportunity Documents section
- [ ] 14. Hero section
- [ ] 15. Admin Financial List
- [ ] 16. Speakers section
- [ ] 17. Admin Speakers page
- [ ] 18. Speakers Dialog
- [ ] 19. Financial Overview
- [ ] 20. Artists Dialog
- [ ] 21. About section
- [ ] 22. Document Library

Notes

- Keep PRs small (1 file → 3–6 subcomponents/hooks) and self-contained.
- Favor colocated unit tests or simple render tests for complex splits when feasible.
