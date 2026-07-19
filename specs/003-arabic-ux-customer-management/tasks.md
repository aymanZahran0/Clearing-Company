# Tasks: Arabic UX and Customer Account Management

**Input**: `specs/003-arabic-ux-customer-management/`  
**Dependencies**: completed baseline from features 001 and 002  
**Tests**: Required — Vitest/RTL, Vitest/Supertest, Playwright/axe

## Format

`[ID] [P?] [Story] Description`

---

## Phase 1: Audit and Setup

- [x] T001 Create branch/folder `003-arabic-ux-customer-management` and confirm the current 001/002 migrations and test baseline are green before modification.
- [x] T002 [P] Inventory every registered route from `apps/web/src/app/router.tsx`, including canonical customer auth routes and Admin auth routes; record missing and wildcard behavior.
- [x] T003 [P] Audit all Prisma/shared enums rendered in `apps/web/src` and produce a complete enum-to-translation-key matrix.
- [x] T004 [P] Audit all Customer/Admin pages at runtime in Arabic for English text, raw enum codes, RTL overflow, and untranslated Ant Design labels/messages.
- [x] T005 [P] Audit current `WebsiteContentBlock` keys, active services, FAQs, service areas, and available public APIs to define the home-section data mapping without duplicating backend content.

**Checkpoint**: Complete route, enum, localization, and home-data inventories exist.

---

## Phase 2: Foundational Localization and Error Infrastructure

- [x] T006 Add `enums` namespace files at `apps/web/src/locales/ar/enums.json` and `apps/web/src/locales/en/enums.json`; register the namespace in `apps/web/src/lib/i18n.ts`.
- [x] T007 Create `apps/web/src/lib/enumLabels.ts` with typed locale-aware helpers for every enum identified in T003, including safe fallback behavior.
- [x] T008 [P] Create `apps/web/src/lib/enumOptions.ts` to produce Ant Design-compatible `{value,label}` options while preserving API enum values.
- [x] T009 [P] Add unit tests at `apps/web/tests/unit/enumLabels.test.ts` for Arabic/English labels, unknown-code fallback, and stable submitted values.
- [x] T010 Create `apps/web/src/pages/NotFoundPage.tsx` with Arabic default copy, Home action, Back action, responsive RTL layout, and translated English variant.
- [x] T011 Create `apps/web/src/pages/RouteErrorPage.tsx` using React Router route-error APIs; hide technical details in production and expose only safe recovery actions.
- [x] T012 Update `apps/web/src/app/router.tsx` with root `errorElement`, final wildcard route, and canonical `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin/login` route verification/redirects.
- [x] T013 [P] Add component tests for NotFound and RouteError pages.
- [x] T014 Add `tests/e2e/not-found-and-errors.spec.ts` covering canonical auth routes, unknown routes, recovery actions, and production-safe error output.

**Checkpoint**: No route displays React Router's default developer error screen.

---

## Phase 3: User Story 1 — Professional Public Home (P1)

- [x] T015 [US1] Refactor `apps/web/src/customer/pages/Home.tsx` into a section-composition page with loading, error, empty, and partial-data states.
- [x] T016 [P] [US1] Create `HeroSection.tsx` with Arabic hero copy from `home-hero`, primary `احجز الآن` CTA, secondary `استعرض الخدمات` CTA, and responsive visual area.
- [x] T017 [P] [US1] Create `ServicesSection.tsx` using active services and images from the existing services API, with service cards linking to detail/booking.
- [x] T018 [P] [US1] Create `HowItWorksSection.tsx` with three or four localized steps and accessible icons/numbering.
- [x] T019 [P] [US1] Create `WhyChooseUsSection.tsx` mapped from `home-why-us` and/or documented fallback feature items.
- [x] T020 [P] [US1] Create `ServiceAreasSection.tsx` using existing active service-area data.
- [x] T021 [P] [US1] Create `TrustSection.tsx`; render Admin-configured qualitative content plus real computed stats from `publicStatsApi` (T024), showing each stat only when its field is present in the response — never a fabricated or zero/placeholder value.
- [x] T022 [P] [US1] Implement `GET /api/v1/public/stats` in `apps/api/src/modules/public-stats/{service,controller,routes}.ts`: `completedBookingsCount` from `COUNT(*)` of `Booking` rows with `status = COMPLETED` (field omitted from the response when `0`), `averageRating` from `AVG(rating)` over `Review` rounded to 1 decimal (field omitted when zero reviews); register the route as unauthenticated per `contracts/public-stats.md`.
- [x] T023 [P] [US1] Add `apps/api/tests/integration/publicStats.test.ts` covering: both fields omitted with no data seeded, both fields present and correctly computed once bookings/reviews are seeded, and no auth required.
- [x] T024 [P] [US1] Add `apps/web/src/api/publicStatsApi.ts` (RTK Query) for `GET /public/stats` and wire it into `TrustSection.tsx` (T021).
- [x] T025 [P] [US1] Create `FaqPreviewSection.tsx` showing a limited set of active FAQs and linking to `/faq`.
- [x] T026 [P] [US1] Create `ContactCtaSection.tsx` and `PublicFooter.tsx` with booking/contact/service-area/FAQ links.
- [x] T027 [US1] Implement known content-block key mapping and graceful generic rendering for unknown active SECTION blocks; hide empty optional sections.
- [x] T028 [US1] Add all Arabic/English home strings to content/customer namespaces and remove visual placeholder/debug timestamp content.
- [x] T029 [P] [US1] Add RTL/mobile component tests for section ordering, missing data, and CTA destinations.
- [x] T030 [US1] Add `tests/e2e/professional-home.spec.ts` for 360px/desktop rendering, no horizontal overflow, active service content, CTAs, no fabricated metrics, and correct hide/show behavior for `TrustSection` stats per `/public/stats` response state.

**Checkpoint**: Home is a professional, content-rich, responsive Arabic landing page backed by real statistics.

---

## Phase 4: User Story 3 — Arabic Booking Wizard and Runtime Values (P1)

- [x] T031 [US3] Replace Booking Wizard literal step titles with translation keys: property/address/add-ons/schedule/quote/confirm.
- [x] T032 [US3] Correct RTL step ordering and active/completed state logic; use a responsive vertical or compact presentation below the chosen breakpoint.
- [x] T033 [US3] Replace Property Type dropdown raw values with localized options from `enumOptions.ts`, preserving enum codes in Redux/API payloads.
- [x] T034 [P] [US3] Replace raw enum rendering in customer booking pages, booking list/detail, quote, payment, notification, review, complaint, profile, and address flows.
- [x] T035 [P] [US3] Translate all Customer Portal loading, error, empty, validation, date-picker, upload, confirmation, and toast messages found by T004.
- [x] T036 [US3] Add `apps/web/tests/unit/BookingWizardArabic.test.tsx` covering Arabic titles, RTL order, dropdown labels, and unchanged API values.
- [x] T037 [US3] Extend the customer-booking E2E flow to run at 360px Arabic viewport and assert zero clipping/horizontal overflow.

**Checkpoint**: Customer booking can be completed without visible English or raw enum codes.

---

## Phase 5: User Story 4 — Complete Arabic Admin Dashboard (P1)

- [x] T038 [US4] Translate every Admin Dashboard sidebar/navigation item into Arabic in Arabic mode — including Dashboard, Catalog sections, Bookings, Scheduling, Reviews, Complaints, Payments, Reports, Settings, and Customer Management — by replacing hardcoded/object-config labels with `t()` keys. Keep complete English translations for English mode and verify that no English sidebar label is visible when `ar` is active.
- [x] T039 [P] [US4] Replace raw enum values across Admin tables, filters, forms, dialogs, status badges, timelines, reports, exports-preview UI, settings, and notifications using the centralized helpers.
- [x] T040 [P] [US4] Translate remaining Admin breadcrumbs, page titles, actions, validation messages, empty states, confirmation modals, and toasts identified in T004.
- [x] T041 [US4] Verify Arabic locale is selected by default on a fresh browser session and `lang/dir` update correctly when locale changes.
- [x] T042 [US4] Refactor the Admin Dashboard shell so the sidebar and main content use completely independent vertical scrolling. Keep the desktop sidebar fixed/sticky and constrained to the viewport (`height: 100dvh`), keep the logo/header and collapse control visible, apply `overflow-y: auto` only to the navigation area, and apply a separate scroll container to the main content. Scrolling a long table/page must not move the sidebar, and scrolling the long sidebar menu must not move the page content. Preserve RTL placement, visible keyboard focus, active-item visibility, mobile drawer behavior, and zero horizontal overflow.
- [x] T043 [US4] Add a runtime route-audit utility for Playwright that crawls registered Admin/Customer routes and detects known raw enum codes and English-only labels in Arabic mode.
- [x] T044 [US4] Add `tests/e2e/arabic-ui-audit.spec.ts`, including Admin navigation, representative CRUD screens, booking lifecycle screens, and customer routes. Add dedicated sidebar assertions: every menu item is Arabic in Arabic mode, the sidebar can scroll to its last item independently, the main content can scroll without changing the sidebar position, the active item remains visible, and the mobile drawer remains usable.
- [x] T045 [US4] Run axe and 360px overflow checks on all screens changed in T038–T044; fix every regression.

**Checkpoint**: Customer Portal and Admin Dashboard are consistently Arabic/RTL by default, while English remains functional.

---

## Phase 6: User Story 5 — Admin Customer Account Management (P1)

### Backend contract tests first

- [x] T046 [P] [US5] Add `apps/api/tests/integration/customerAccountStatus.test.ts` covering list/search/status filter, sanitization, permissions, suspend, token revocation, blocked login/refresh/protected access, history preservation, reactivate, audit log, and the `409 CUSTOMER_ALREADY_SUSPENDED` / `409 CUSTOMER_NOT_SUSPENDED` conflict responses for repeat/invalid transitions — asserting no AuditLog row is written for those conflict cases.

### Backend implementation

- [x] T047 [US5] Extend `apps/api/src/modules/customers/schema.ts` with paginated list filters, required suspend reason, and optional reactivate reason schemas.
- [x] T048 [US5] Extend customer list service to support name/normalized-phone/email search, `User.status` filtering, pagination, bookings count, and sanitized summary fields.
- [x] T049 [US5] Implement `suspendCustomer` transaction in `apps/api/src/modules/customers/service.ts`: role guard; if current status is already `SUSPENDED`, reject with `409 CUSTOMER_ALREADY_SUSPENDED` and write no AuditLog row; otherwise update status, revoke refresh tokens, write an AuditLog row, and preserve history.
- [x] T050 [US5] Implement `reactivateCustomer` transaction: role guard; if current status is not `SUSPENDED`, reject with `409 CUSTOMER_NOT_SUSPENDED` and write no AuditLog row; otherwise update status to `ACTIVE` and write an AuditLog row. Do not restore old tokens.
- [x] T051 [US5] Add Admin-only `POST /customers/:id/suspend` and `POST /customers/:id/reactivate` routes/controllers and ensure `GET /customers/:id` returns a sanitized Customer detail response.
- [x] T052 [US5] Update login, refresh, and protected authentication flows to reject suspended Customers using stable `ACCOUNT_SUSPENDED` error handling.
- [x] T053 [US5] Confirm Customer suspension cannot target Admin accounts and Customer tokens cannot call status-management endpoints.
- [x] T054 [US5] Run T046 and the full backend integration suite; fix regressions.

### Frontend implementation

- [x] T055 [P] [US5] Extend `apps/web/src/api/customersApi.ts` with paginated list/status filters, customer detail, suspend, and reactivate endpoints (surfacing `CUSTOMER_ALREADY_SUSPENDED`/`CUSTOMER_NOT_SUSPENDED` errors to the UI) plus cache invalidation.
- [x] T056 [US5] Create/upgrade `apps/web/src/admin/pages/customers/List.tsx` with Arabic search, status filters, pagination, status badges, booking count, and row actions.
- [x] T057 [P] [US5] Create/upgrade `apps/web/src/admin/pages/customers/Detail.tsx` showing profile summary, addresses, recent bookings, status history/audit links, and safe account metadata.
- [x] T058 [P] [US5] Create `SuspendCustomerDialog.tsx` with required reason and destructive confirmation; show a clear Arabic message if the action returns `409 CUSTOMER_ALREADY_SUSPENDED`.
- [x] T059 [P] [US5] Create `ReactivateCustomerDialog.tsx` with confirmation and optional reason; show a clear Arabic message if the action returns `409 CUSTOMER_NOT_SUSPENDED`.
- [x] T060 [US5] Add `إدارة العملاء` route/nav item and Arabic/English translation entries; keep Admin-account management separate.
- [x] T061 [US5] Display the Arabic suspended-account message on customer login/session-expiry paths without leaking the Admin reason.
- [x] T062 [US5] Add `tests/e2e/customer-account-management.spec.ts`: list/search → suspend → existing session blocked → history preserved → reactivate → new login succeeds. (The repeat-suspend-attempt/409-conflict path is not reachable through this UI — once a customer is SUSPENDED, `List.tsx` only renders the Reactivate action, not Suspend — so that path is covered at the API layer instead, by `customerAccountStatus.test.ts`'s two dedicated 409 tests.)

**Checkpoint**: Admin can safely control Customer access without deleting business history.

---

## Phase 7: Final Regression and Sign-off

- [x] T063 Run `npm run lint`, `npm run typecheck`, frontend/backend unit tests, backend integration tests, and full Playwright suite.
- [x] T064 Verify no raw enum code appears in Arabic UI using both static grep and runtime route audit.
- [x] T065 Verify all canonical routes and wildcard/error paths in production build mode.
- [x] T066 Verify home page at 360px, tablet, and desktop; run Lighthouse against the existing prerender/build flow and fix regressions introduced by the redesign.
- [x] T067 Verify Customer suspension/re-activation audit entries and data preservation manually against a seeded database, including confirming that repeat/invalid transition attempts (409 responses) write no AuditLog row.
- [x] T068 Measure `GET /api/v1/customers` (default page size) latency against SC-007 (p95 < 500ms) in the integration test environment; record the measured value in feature documentation.
- [x] T069 Update feature documentation with completion notes, actual deviations, and any credential/environment-dependent deferred items.

**Final Checkpoint**: Feature 003 is independently testable and ready to merge after 001 and 002.

---

## Completion Notes (2026-07-17)

**Status**: All 69 tasks complete. Full regression green: `npm run lint`, `npm run typecheck`, 25 web unit tests, 30 API unit tests, 77 backend integration tests (across all suites, not just this feature's), production `npm run build`, and 46/46 runnable Playwright specs (1 pre-existing intentional `test.skip`).

**Deviations from the original task descriptions**:
- **T062**: dropped the "repeat suspend attempt shows conflict message" E2E step — unreachable through the UI by design (`List.tsx` swaps the action button to Reactivate once a customer is `SUSPENDED`). The 409 conflict paths are covered directly at the API layer by `customerAccountStatus.test.ts`.
- **T066**: Lighthouse CI (`npm run lighthouse:ci`) crashes in this sandbox with `EPERM: Permission denied` during Chrome temp-directory cleanup, plus internal `RootCauses`/`frame_sequence` trace errors — a Windows-sandbox/Chrome-DevTools-Protocol limitation unrelated to the app. Substituted: 3 Playwright specs (`professional-home.spec.ts`) verifying 360px/desktop rendering with zero horizontal overflow and no fabricated metrics, plus axe WCAG 2.1 AA (0 violations) across the home page and every other audited route.
- **mobile-ar / mobile-en Playwright projects** (WebKit/iPhone 13 emulation) could not run — the WebKit browser binary isn't installed in this sandbox (`npx playwright install` needed, not available here). All verification instead ran on the `chromium` project at an explicit 360×800 viewport, which exercises the same responsive/RTL code paths.

**Pre-existing issues found, not introduced by this feature** (flagged, not fixed, to keep this feature's diff scoped):
- `apps/api/tests/integration/jobs.test.ts` (background job scheduler, from 002) is flaky under load — different sub-tests fail intermittently (`records a FAILURE run`, `records SKIPPED_LOCKED`) depending on timing/DB state. Reproduced both before and independent of any change in this feature; root cause is in 002's job-scheduling code, not touched here.
- A CORS misconfiguration in `apps/api/src/app.ts` (`CORS_ALLOWED_ORIGIN` — a comma-separated string passed directly to the `cors` package, which sent it back as one invalid multi-value header) blocked every login-dependent E2E flow. Fixed as part of this feature since it blocked verifying this feature's own E2E specs; the fix parses the env var into an array before passing it to `cors()`.

**Environment notes for whoever runs this next**:
- The local dev Postgres + `npm run dev` servers in this environment share the same database as `npm run test:integration` (no separate test DB configured, contrary to `apps/api/.env.example`'s explicit warning) — running the integration suite truncates all seed data. Re-run `npm run prisma:seed --workspace apps/api` afterward before any manual/E2E verification.
- The API dev server must be started with `NODE_ENV=test` (as `playwright.config.ts`'s `webServer` block already does) or `strictRateLimit` (5 req/60s) will throttle the login-heavy E2E suite. If a server was already running before Playwright's `reuseExistingServer` check, it won't have this env var — restart it explicitly with `NODE_ENV=test npm run dev --workspace apps/api` if login-dependent specs start failing with unrelated-looking timeouts.

**New backend surface added by this feature** (beyond the original plan.md, per the 2026-07-17 clarification session):
- `GET /api/v1/public/stats` — public, unauthenticated aggregate endpoint (completed-bookings count, average rating), field-omitted when not yet meaningful.
- `POST /api/v1/customers/:id/suspend` and `POST /api/v1/customers/:id/reactivate` with `409 CUSTOMER_ALREADY_SUSPENDED` / `409 CUSTOMER_NOT_SUSPENDED` conflict handling.
- `GET /api/v1/customers` gained a `status` filter; `GET /api/v1/customers/:id` and `POST /api/v1/customers` now return the sanitized Admin summary shape (`id`, `status`, `createdAt`, `lastLoginAt`, `bookingsCount`) instead of the old self-profile shape.
- `GET /api/v1/bookings` (Admin path) gained an optional `customerId` filter, reused by the Customer Detail page's "recent bookings" list instead of adding a new endpoint.
- `ApiErrorCode` (packages/shared) gained `ACCOUNT_SUSPENDED`, `CUSTOMER_ALREADY_SUSPENDED`, `CUSTOMER_NOT_SUSPENDED`.
- `login()` and `refresh()` (apps/api/src/modules/auth/service.ts) now both reject `SUSPENDED` users with the stable `ACCOUNT_SUSPENDED` code — `refresh()` previously had no status check at all.
