### Next Sprint Plan — Homepage MVP Finalization

Scope: Wire all homepage CTAs, replace broken anchors, add/download assets, and close hardcoded placeholders with minimal working paths. Keep changes incremental and reversible.

### 1) Fix anchors and CTA targets

- HeroSection
  - Change View Investment Opportunity href to `#investment-opportunity`
  - Retarget Executive Summary to `#financial-transparency` (or add an `id="executive-summary"` wrapper if preferred)
  - Link Request Full Access to `/request-access`
- InvestmentOpportunitySection
  - SponsorshipTiers: Link Become a Sponsor to `/request-access?type=sponsor`
  - DocumentsSection: Bottom CTA “Request Complete Documentation Package” to `/request-access?type=docs` (keep existing mailto fallback)
- FinancialTransparencySection
  - Download Financial Report → `/docs/financial-report.pdf`
  - View Sponsor Deck → `/docs/sponsor-deck.pdf`
  - Benefits tab "Secure Sponsorship" → `/request-access?type=sponsor`
- FeaturesSection
  - Register Now → `/request-access?type=register`
  - Card "Learn more" → map to appropriate sections (e.g. `#technology-platform`, `#investment-opportunity`) — decide mapping and implement
- AboutSection
  - Download Brochure → `/docs/brochure.pdf`
- CulturalWorkshopsSection
  - Reserve Your Spot → `/request-access?type=workshop`
  - View Full Schedule → `#schedule`
  - Download Workshop Guide → `/docs/workshop-guide.pdf`
- ScheduleSection
  - Add to calendar → `/calendar/event.ics` (static ICS file)
  - Download Full Schedule → `/docs/schedule.pdf`
  - Get Notified → `/request-access?type=notify`
- SpeakersSection
  - Stay Updated → `/request-access?type=updates`
  - Become a Speaker → `/request-access?type=speaker`
- SponsorsSection
  - Secure Sponsorship (per tier) → `/request-access?type=sponsor`
  - Download Sponsorship Kit → `/docs/sponsorship-kit.pdf`
- TechnologyPlatformSection
  - Request Platform Demo → `/request-access?type=demo`
  - Download Technical Specs → `/docs/technical-specs.pdf`
- TradeContextSection
  - Explore Sponsorship → `/request-access?type=sponsor`
  - View Trade Statistics → add external credible source link (Destatis / TradingEconomics)

Acceptance criteria

- All listed buttons navigate without console errors or 404s
- Hero anchors resolve to real sections with smooth scroll
- No remaining broken `#` anchors on homepage

### 2) Public assets and docs

- Add OG/Twitter images used by `src/app/page.tsx`
  - `public/images/og-image.jpg`
  - `public/images/twitter-image.jpg`
- Create `public/docs/` and add these files (placeholders allowed initially):
  - `brochure.pdf`, `proposal.pdf`, `sponsorship-kit.pdf`, `financial-report.pdf`, `sponsor-deck.pdf`, `workshop-guide.pdf`, `schedule.pdf`, `technical-specs.pdf`
- Create `public/calendar/event.ics` for schedule (global event placeholder is fine for MVP)

Acceptance criteria

- All download links return 200 and download a file
- Social meta images exist and appear in local preview inspectors

### 3) Sponsors logos section

- Either provide real logos under `public/images/sponsors/…` for the listed brands or temporarily hide the grid until assets are ready
  - If assets not available this sprint, hide the logos block but leave sponsorship tiers visible

Acceptance criteria

- No broken image requests in Network tab
- UI layout remains consistent when hidden

### 4) Lead capture reuse

- Reuse existing `/request-access` for lead capture with `type` query param (notify, updates, speaker, sponsor, docs, demo, register, workshop)
- Add lightweight analytics events for clicks (optional nice-to-have)

Acceptance criteria

- Submitted forms land in current admin flow; no new backend required

### 5) Calendar and schedule

- Generate a basic static `event.ics` covering event dates; wire “Add to calendar” to the ICS
- Optionally add Google Calendar add URL (stretch)

Acceptance criteria

- ICS downloads and imports to Apple/Google Calendar successfully

### 6) Chat voice toggle (optional)

- Hide voice toggle until implemented, or implement Web Speech API basic start/stop

Acceptance criteria

- No misleading UI; if shown, mic button starts/stops recording and fills input

### 7) Data sanity pass

- Verify live financial data renders and BroadcastChannel triggers rerender
- Confirm speakers/artists lists load from `/api/*/public`

Acceptance criteria

- No fallback placeholders when API returns data
- No client/hydration warnings in console

### 8) QA checklist

- Run grep for missing anchors and 404 assets
- Click-through every CTA on homepage
- Lighthouse quick pass for obvious regressions

### Estimation and sequencing (small, incremental edits)

1. Anchors + CTA wiring (1 dev-day)
2. Docs + ICS placeholders (0.5 dev-day)
3. Sponsors logos or hide (0.5 dev-day)
4. Lead capture param mapping + analytics (0.5 dev-day)
5. Optional voice toggle handling (0.5 dev-day)
6. QA pass (0.5 dev-day)

### Out of scope (this sprint)

- Dynamic calendar per-session ICS
- Fully dynamic sponsor logos CMS
- Advanced chat voice transcription pipeline
