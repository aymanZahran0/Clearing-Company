<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
  - IV. Accessibility & Phone-Booking Parity — "customer-service agent" reworded to "Admin"
    to match the two-role (Customer/Admin) model finalized in spec.md; no other staff
    accounts exist in the system.
  - Technology & Platform Constraints — replaced the originally-named Next.js/React 19
    monolith with the actual, plan-approved decoupled stack: React 18 + Vite 5 SPA
    (`apps/web`) + Express 4/Prisma REST API (`apps/api`) + shared Zod/TS package
    (`packages/shared`), npm workspaces, Vitest/RTL/Supertest/Playwright testing.
Added sections: none
Removed sections: none
Rationale for MINOR bump: no principle was added or removed, but the Technology &
Platform Constraints section changed substantively (not just wording) to reflect the
architecture actually implemented, per the explicit follow-up recommendation recorded in
plan.md's Constitution Check and research.md R9. Principle IV's terminology fix is a
same-scope clarification riding along with this amendment.
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (generic Constitution Check gate already accommodates these principles; no edits required)
  ✅ .specify/templates/spec-template.md (locale/accessibility/performance criteria fit existing Success Criteria & Requirements sections; no edits required)
  ✅ .specify/templates/tasks-template.md (Polish phase already covers i18n/perf/accessibility-shaped tasks generically; no edits required)
  ✅ specs/001-cleaning-company-platform/plan.md (already documents this stack; the deviation this amendment resolves was recorded there under Complexity Tracking/Constitution Check)
  ✅ specs/001-cleaning-company-platform/research.md (R9 explicitly recommended this amendment; no further edits needed there)
Follow-up TODOs: none
-->

# Nuqaa Asir Cleaning Booking & Operations Platform Constitution

## Core Principles

### I. Production-Grade Code Quality

All code merged to the main branch MUST be production-grade, not prototype-grade. This means:
TypeScript strict mode with no `any` used to silence the compiler; all inputs validated at
system boundaries (API routes, forms, webhooks) with Zod or an equivalent schema validator;
every service, pricing rule, and booking-state transition covered by automated tests before
merge; and no commented-out code, dead code paths, or TODO-without-ticket left in shipped
files. Code review MUST verify correctness, not just style. Errors that affect money
(pricing, quotes, invoices) or scheduling (bookings, team assignment) MUST fail loudly and
be logged with enough context to reconstruct the failure — silent fallbacks are prohibited
in these paths.

**Rationale**: This platform handles real money, real schedules, and real customers' homes.
A booking bug or a silent pricing error has direct financial and reputational cost to the
business, unlike an internal tool where a bug is merely inconvenient.

### II. Mobile-First Responsive Design

Every screen MUST be designed and built for small viewports first, then progressively
enhanced for tablet and desktop. Booking flows, quote review, and the operations dashboard
MUST be fully usable on a phone-sized viewport (360px width minimum) without horizontal
scrolling, with touch targets sized to at least 44×44px. No feature may ship desktop-only
and mobile-degraded; if a feature cannot work well on mobile, it MUST be redesigned before
merge, not shipped with a "fix later" caveat.

**Rationale**: Customers in Abha and Khamis Mushait predominantly browse and book from
phones, and field teams (supervisors, crew leads) will use the operations views from mobile
devices on-site. Desktop is the secondary form factor for this product, not the primary one.

### III. Bilingual & RTL-Correct Internationalization

Arabic (`ar-SA`, RTL) is the primary locale and English (LTR) MUST be supported as a
first-class secondary locale, not a stub. All user-facing strings MUST be sourced from the
i18n layer — no hardcoded UI text in components. Layouts MUST use logical CSS properties
(`start`/`end`, not `left`/`right`) so mirroring between RTL and LTR is automatic, not
patched per-page. Dates, currency (SAR), phone numbers, and numerals MUST be formatted per
the active locale's conventions. Any new user-facing feature MUST ship with both locales
translated before merge; English-only or Arabic-only screens are not acceptable in
production.

**Rationale**: The business operates in Saudi Arabia with Arabic-speaking customers as the
default audience, but must also serve English-speaking residents, expatriates, and
commercial clients. Retrofitting RTL support after a feature ships is far more expensive
than building it in from the start.

### IV. Accessibility & Phone-Booking Parity

The platform MUST meet WCAG 2.1 AA for all public-facing and booking-critical flows:
sufficient color contrast, visible focus states, full keyboard operability, semantic
HTML/ARIA labeling, and screen-reader-friendly form errors. Because a meaningful share of
customers — particularly older customers — will book by calling in rather than using the
website directly, every booking flow MUST also be operable end-to-end by Admin on behalf of
a caller: no step may require the customer to be physically present at a screen (e.g. no
customer-side-only OTP as the sole confirmation path, no drag-only interactions without a
keyboard/click equivalent). Text MUST remain legible when browser zoom is increased to 200%.

**Rationale**: This is a phone-first-in-practice business even though the product is a web
platform — Admin, the platform's single internal role, is a primary booking channel
(phone/WhatsApp) alongside the website itself, and older customers are an explicit target
demographic per the business proposal.

### V. Performance & SEO by Default

Public marketing and service-catalog pages MUST be server-rendered or statically generated
for fast first paint and full crawlability, and MUST hit Core Web Vitals "Good" thresholds
(LCP < 2.5s, INP < 200ms, CLS < 0.1) on a throttled mobile profile. Every public page MUST
have correct per-locale metadata (title, description, hreflang alternates, Open Graph tags)
and be included in the sitemap. Images MUST be served responsively and lazy-loaded below the
fold. Performance and SEO regressions MUST be caught before merge (Lighthouse or equivalent
CI check on public routes), not discovered after launch.

**Rationale**: Customers find this business primarily through search and shared links before
they ever book; slow or unindexable public pages directly cost leads in a local-services
market where competitors are one search result away.

## Technology & Platform Constraints

The stack is TypeScript 5.x on Node.js 22 LTS, delivered as a decoupled monorepo: `apps/web`
— React 18 + Vite 5 single-page application (React Router 6, Redux Toolkit/RTK Query,
Tailwind CSS, Ant Design, react-i18next) — and `apps/api` — Express 4 REST API with Prisma
ORM against PostgreSQL 16+, Zod validation, JWT access/refresh authentication, `helmet` and
`express-rate-limit`, and `pino` structured logging. `packages/shared` holds the Zod schemas
and TypeScript types both apps import, so client- and server-side validation cannot drift.
Testing is Vitest + React Testing Library (`apps/web`), Vitest + Supertest (`apps/api`), and
Playwright for cross-app end-to-end coverage. Package management is npm workspaces (not
pnpm — `corepack enable` requires elevated permissions unavailable in this environment).
This is a two-deployable architecture — one static SPA and one Node.js API service — against
a single PostgreSQL database: no microservices, no message broker. Any deviation from this
stack for a new subsystem MUST be justified in that feature's plan under Complexity
Tracking. Secrets and credentials MUST NOT be committed to the repository;
environment-specific configuration MUST go through environment variables documented in the
relevant plan.

## Development Workflow & Quality Gates

Every feature plan MUST pass the Constitution Check gate before implementation begins and
again before merge. Pull requests MUST demonstrate: passing automated tests, a locale check
(Arabic and English both verified, RTL layout checked), a mobile-viewport check, and no new
accessibility violations on booking-critical flows. Features that touch pricing, booking
state, or scheduling MUST include integration tests covering the state transitions they
introduce or change. Reviewers MUST block merges that violate any Core Principle above
without an approved, documented exception in the plan's Complexity Tracking table.

## Governance

This constitution supersedes ad-hoc practice for all work on this repository. Amendments
require: a documented rationale for the change, a version bump per the policy below, and
propagation of the change into any dependent template (`plan-template.md`,
`spec-template.md`, `tasks-template.md`) in the same change set. Versioning follows semantic
rules — MAJOR for backward-incompatible governance or principle redefinitions/removals,
MINOR for new principles or materially expanded guidance, PATCH for clarifications and
wording fixes. All plans and PRs MUST verify compliance with this constitution; complexity
or deviation MUST be justified in the plan's Complexity Tracking section rather than silently
introduced.

**Version**: 1.1.0 | **Ratified**: 2026-07-12 | **Last Amended**: 2026-07-14
