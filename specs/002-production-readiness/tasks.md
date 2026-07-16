# Tasks: Production Readiness

**Input**: Design documents from `/specs/002-production-readiness/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Included as first-class tasks (not optional) — the constitution mandates tests before merge, and two of this feature's own user stories (US2, US3) are specifically about the test suites. New backend contracts (US6, US7, US8, US9, US10) get an integration test written *before* their implementation tasks (TDD); UI-only stories (US4, US5) get an e2e test after, since there's no new backend contract to fail against first.

**Organization**: Phases follow spec.md's user-story order exactly (US1–US12, in the priority spec.md assigned each). Two feature areas span multiple stories rather than owning one (internationalization completion, FR-011–FR-014; public-page prerendering, FR-015–FR-017) — each gets its own unlabeled cross-cutting phase, placed where its prerequisites are first satisfied, per the Foundational/Polish convention (no `[Story]` label).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to spec.md's US1–US12 labels; omitted for Setup/Foundational/cross-cutting/Polish phases

---

## Phase 1: Setup

**Purpose**: Install new dependencies and tooling this feature needs, on top of the existing stack.

- [ ] T001 ~~Add `node-cron`, an SMTP email library (e.g. `nodemailer`), an SMS provider SDK, and `@sentry/node` to `apps/api/package.json`~~ — `node-cron` added; SMTP/SMS/Sentry deps deferred (no live credentials this session)
- [ ] T002 [P] ~~Add `@sentry/react` to `apps/web/package.json`~~ — deferred (Sentry integration out of scope this session)
- [ ] T003 [P] ~~Add `EMAIL_SMTP_HOST`, ... `SENTRY_DSN` to `apps/api/.env.example`~~ — deferred (no live credentials this session)
- [ ] T004 [P] ~~Add `VITE_SENTRY_DSN` to `apps/web/.env.example`~~ — deferred (Sentry integration out of scope this session)
- [X] T005 Add `"test:integration": "npm run test:integration --workspace apps/api"` to the root `package.json` scripts (research.md R12)
- [X] T006 [P] Add an i18n literal-string ESLint rule (`eslint-plugin-i18next`'s `no-literal-string`) to `eslint.config.js`, scoped to `apps/web/src/**/*.tsx` (research.md R11)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, adapters, and scheduling plumbing every later phase depends on.

**⚠️ CRITICAL**: No user story work may begin until this phase is complete.

- [X] T007 Add `RescheduleRequestStatus`, `JobName`, `JobRunStatus` enums and `RescheduleRequest`, `JobRun` models to `apps/api/prisma/schema.prisma` (data-model.md §1–§2)
- [X] T008 Run `npx prisma migrate dev --name production_readiness` in `apps/api` to generate `apps/api/prisma/migrations/<timestamp>_production_readiness/` (data-model.md Migration Plan) — plus a follow-up migration adding the partial-unique index (bookingId where status='PENDING') that Prisma schema syntax can't express
- [X] T009 Regenerate the Prisma client: `npm run prisma:generate --workspace apps/api`
- [ ] T010 [P] ~~Create `apps/api/src/lib/notifications/index.ts` defining the `EmailAdapter`/`SmsAdapter` interfaces~~ — deferred (no live SMTP/SMS credentials this session)
- [ ] T011 [P] ~~Create `apps/api/src/lib/notifications/emailAdapter.ts`~~ — deferred
- [ ] T012 [P] ~~Create `apps/api/src/lib/notifications/smsAdapter.ts`~~ — deferred
- [ ] T013 ~~Create `apps/api/src/lib/notifications/factory.ts`~~ — deferred (depends on T010–T012)
- [X] T014 Add a `notify()` helper to `apps/api/src/modules/notifications/service.ts` that always writes a `NotificationLog` row (`status: PENDING`) and never rethrows — log-only for now; wiring to a real email/SMS adapter factory is deferred until T010–T013 land
- [X] T015 [P] Create `apps/api/src/lib/jobs/lock.ts` — `tryAdvisoryLock`/`releaseAdvisoryLock` via `pg_try_advisory_lock`/`pg_advisory_unlock` (research.md R2)
- [X] T016 Create `apps/api/src/lib/jobs/scheduler.ts` — `runJob()` wrapper (writes `JobRun`, applies T015's lock) and `node-cron` registration of all three jobs in `apps/api/src/jobs/` at `*/15 * * * *` (contracts/health-and-jobs.md, research.md R1; depends on T007–T009, T015)
- [X] T017 Start the T016 scheduler from `apps/api/src/server.ts` after the HTTP server begins listening
- [X] T018 Extend `GET /api/v1/health` in `apps/api/src/app.ts` to run a Prisma `SELECT 1` and return `{ status, db, timestamp }`, keeping the existing path/200-on-healthy contract (contracts/health-and-jobs.md)
- [ ] T019 [P] ~~Initialize `@sentry/node` in `apps/api/src/server.ts`~~ — deferred (Sentry integration out of scope this session)
- [X] T020 Split `apps/web/src/locales/{ar,en}/common.json` into `common.json`/`admin.json`/`customer.json`/`catalog.json`/`content.json` namespaces and register them in `apps/web/src/lib/i18n.ts` (research.md R11) — new namespaces start empty, populated as each user-story phase adds its UI

**Checkpoint**: Foundation ready — schema, notification adapters, job scheduler, health check, and i18n namespace structure all exist.

---

## Phase 3: User Story 1 - Operator Stands Up a Working Environment (Priority: P1)

**Goal**: A fresh PostgreSQL database migrates and seeds cleanly into a fully browsable, demoable instance.

**Independent Test**: Point an empty PostgreSQL instance at the migrations and seed script; confirm the catalog is browsable and one active Admin account can log in.

- [X] T021 [US1] Verify `apps/api/prisma/migrations/20260714091905_init` applies cleanly to a freshly created empty database via `prisma migrate deploy`; fix any issue found — verified against `nuqaa_asir_fresh_test`, no issues found
- [X] T022 [US1] Verify `apps/api/prisma/migrations/<timestamp>_production_readiness` (T008) applies cleanly immediately after the init migration, in sequence
- [X] T023 [US1] Extend `apps/api/prisma/seed.ts` to also seed sample `WebsiteContentBlock` and `FaqItem` rows (currently unseeded per inspection)
- [X] T024 [US1] Run `npm run prisma:seed --workspace apps/api` against a fresh database and manually confirm it produces a complete, browsable catalog, at least one active Admin, and enough data to exercise every 001 baseline story
- [X] T025 [P] [US1] Document the per-environment PostgreSQL configuration convention (local/test/staging/production use separate `DATABASE_URL` values, no shared credentials) as comments in `apps/api/.env.example`
- [X] T026 [US1] Confirm re-running `prisma migrate deploy` against an already-migrated database is a no-op success (FR-004)

**Checkpoint**: User Story 1 independently functional — environments stand up reliably.

---

## Phase 4: User Story 2 - Backend Integration Suite Runs Clean Against a Real Database (Priority: P1)

**Goal**: The existing backend integration suite passes 100% against a disposable PostgreSQL database.

**Independent Test**: Create a disposable test database, run `npm run test:integration --workspace apps/api`, confirm a 100% pass rate.

- [X] T027 [US2] Run the full `apps/api/tests/integration/` suite (18 existing files) against a disposable Postgres test database and record every failure — found 11 failing tests across 5 files, all traced to a shared in-memory rate-limit store persisting across the whole vitest process (fileParallelism: false) plus 2 genuine bugs (see T028)
- [X] T028 [US2] Fix each failure found in T027 — root-caused to: (1) `strictRateLimit`/`standardRateLimit` accumulating hits across every test file in the shared vitest process, fixed by skipping rate limiting under `NODE_ENV=test` in `apps/api/src/middleware/rateLimit.ts`; (2) `saudiPhoneSchema` in `packages/shared/src/schemas/common.ts` rejected spaced/dashed phone numbers that `normalizeSaudiPhone` explicitly supports — fixed the schema, not the test; (3) `execution.test.ts`'s checklist-gating test never opened the checklist (which lazily creates the `ChecklistRun`) before asserting on it — fixed the test to match the app's documented lazy-creation behavior. Also fixed 2 pre-existing lint errors (`markEnRoute`/`markArrived` silently dropping their `actor` param — now audit-logged) blocking a clean `npm run lint`.
- [X] T029 [US2] Confirm `apps/api/tests/setup.ts`'s truncate-between-tests helper correctly isolates every existing integration test file with no cross-test pollution — confirmed via two consecutive full-suite runs, both 18/18 files green
- [X] T030 [US2] Confirm `npm run test:integration --workspace apps/api` runs green end to end against a freshly created container-based Postgres (`docker run postgres:16`) — verified against the project's `nuqaa-postgres` container (image `postgres:16`)

**Checkpoint**: User Story 2 independently functional — integration suite is trustworthy.

---

## Phase 5: User Story 3 - End-to-End Suite Runs Clean Against the Full Stack (Priority: P1)

**Goal**: The existing Playwright suite passes 100% against the real frontend, API, and database running together.

**Independent Test**: Start all three tiers, run `npm run test:e2e`, confirm every scenario passes without mocking any tier.

- [X] T031 [US3] Run the full `tests/e2e/` suite (10 existing specs) against the running stack and record every failure — found ~30 distinct failures on `chromium`, root-caused to: a login-then-hard-navigate race condition present in 6+ spec files (no wait for the async credential-set to land before `page.goto`), an app-level bug where accessToken was never rehydrated on page load (no session persistence across reloads — see T032), Ant Design `Select`/`Radio.Button` DOM quirks (ARIA-only hidden listbox nodes, virtualized options), several shared-seed-fixture data races between tests/spec files, two WCAG contrast failures in Ant Design's default theme tokens, and three genuine backend/frontend bugs (see T032)
- [X] T032 [US3] Fix each failure found in T031 — **app bugs fixed** (not test-only): (1) no session rehydration on page load — added `AuthBootstrap`/`useRefreshMutation` silent-refresh-on-load so a reload/deep-link doesn't bounce a logged-in user (`apps/web/src/features/auth/AuthBootstrap.tsx`, `authSlice.ts`, `authApi.ts`); (2) `RequireAuth`/`RequireRole` always redirected to `/login` even for `/admin/*` routes, ignoring the dedicated `/admin/login` page (`apps/web/src/guards/{RequireAuth,RequireRole}.tsx`); (3) `saudiPhoneSchema` rejected spaced/dashed phone numbers `normalizeSaudiPhone` explicitly supports (`packages/shared/src/schemas/common.ts`); (4) seeded `ServiceArea` rows used non-UUID literal ids (`"seed-area-abha"`), 422-rejected by every API schema expecting a UUID — real customers selecting a seeded area would have hit this (`apps/api/prisma/seed.ts`); (5) the customer booking wizard never computed/sent `sizeMultiplier` for PROPERTY_SIZE-priced services, so every such booking (including the flagship "Home Cleaning") silently fell back to "manual review required" regardless of room count (`QuoteReviewStep.tsx`); (6) Admin's customer-search-by-phone sent raw local-format input against E.164-stored numbers, never matching (`apps/api/src/modules/customers/service.ts`); (7) header nav links/logo had no vertical padding at the desktop breakpoint, well under the 44px touch-target minimum (`AppShell.tsx`); (8) two Ant Design default-theme WCAG contrast failures (`colorPrimary`, `colorTextDescription` — `AppProviders.tsx`); (9) `ScheduleDialog`'s Time Slot `Select` had no accessible label/value wiring conflicts and a virtualized option list that hid options past the visible window (`virtual={false}` — `ScheduleDialog.tsx`); (10) `NewPhoneBooking.tsx`'s Service field had no `name`, so Ant Design never wired the label-to-control association (unreachable by assistive tech). **Test-only fixes**: added `waitForURL` after every login submit before a subsequent hard navigation; rewrote `booking-confirmation-and-pricing`, `execution-and-checklist`, `review-and-rework`, and `scheduling-and-capacity` specs to create their own fixtures via the API instead of racing over shared seed rows; fixed several Ant Design `Select`/`Radio.Button` locator strategies (ARIA-only hidden option nodes, `role="dialog"` scoping, keyboard-driven selection); disambiguated a "New Phone Booking" strict-mode match; broadened one assertion to accept the app's actual default-locale (Arabic) text.
- [~] T033 [US3] Confirm `tests/e2e/access-control-and-rtl.spec.ts` and `tests/e2e/accessibility.spec.ts` pass on both the `mobile-ar` and `mobile-en` Playwright projects — **could not verify**: WebKit (the engine both projects use) fails to install in this sandbox with a persistent `EPERM` on the downloaded executable (looks like antivirus/real-time-scan interference on a freshly-written unsigned .exe, reproduced across a full reinstall). The full suite (28 tests) passes 100% on the `chromium` project, including this same file's RTL (`dir` attribute)/touch-target assertions — `mobile-ar`/`mobile-en` need verification in an environment where WebKit installs cleanly (a normal dev machine or CI runner).
- [X] T034 [US3] Confirm `playwright.config.ts`'s `webServer` health-check against `GET /api/v1/health` still passes after T018's response-body change — implicitly verified throughout T031/T032: every e2e run's `webServer` readiness probe against the new `{status, db, timestamp}` body succeeded

**Checkpoint**: User Story 3 independently functional — e2e suite is trustworthy.

---

## Phase 6: Internationalization Completion (Cross-Cutting — supports FR-011–FR-014)

**Purpose**: Close the hardcoded-string gap found during codebase inspection before the new UI work in US4/US5/US6/US10 adds more surface area to audit later.

- [X] T035 Grep-audit `apps/web/src/admin/**/*.tsx` and `apps/web/src/customer/**/*.tsx` for hardcoded literal UI strings and produce a fix list — used `npm run lint` (T006's rule) directly as the audit: 53 files, 139 violations
- [X] T036 [P] Replace hardcoded strings in `apps/web/src/admin/pages/bookings/List.tsx` and `NewPhoneBooking.tsx` with `t()` calls against `admin.json` (adding both `ar`/`en` entries)
- [X] T037 [P] Replace hardcoded strings in `apps/web/src/admin/pages/content/FAQs.tsx` and `apps/web/src/admin/pages/schedule/OperatingHours.tsx` with `t()` calls against `admin.json`/`content.json`
- [X] T038 [P] Replace hardcoded strings in `apps/web/src/admin/pages/settings/SystemSettings.tsx` and any remaining untranslated Admin files identified in T035 with `t()` calls against `admin.json` — all 43 flagged Admin files fixed (bookings, catalog, commercial, content, notifications, payments, pricing, quality, reports, schedule, settings, subscriptions)
- [X] T039 [P] Replace hardcoded strings in `apps/web/src/customer/pages/BookingWizard/QuoteReviewStep.tsx` and `apps/web/src/customer/pages/PublicBookingLookup.tsx` with `t()` calls against `customer.json` — all 10 flagged Customer files fixed
- [X] T040 Run `npm run lint` (with T006's rule active) across `apps/web/src` and fix every remaining hardcoded-string violation — 0 errors, 0 warnings. Also fixed 4 unrelated pre-existing lint failures found along the way: 2 unused-var errors, a CJS `require()` import in `tailwind.config.ts`, and `eslint-plugin-react-hooks` never being registered despite existing `eslint-disable` comments referencing it (now registered with real `exhaustive-deps`/`rules-of-hooks` enforcement).
- [X] T041 Manually verify RTL (Arabic) and LTR (English) rendering — no overlap, clipping, or misaligned controls — on every screen touched by T036–T039 (FR-013) — automated coverage via `tests/e2e/access-control-and-rtl.spec.ts` (dir attribute + no horizontal overflow on 5 public routes) and `tests/e2e/accessibility.spec.ts` (10 pages, 0 WCAG violations after fixing 2 real contrast bugs), plus a manual screenshot spot-check of the Home page in both locales (clean mirroring, no overlap). **Known gap**: `AdminShell.tsx`'s sidebar nav labels (~24 items) and `OperatingHours.tsx`'s `WEEKDAY_LABELS` are still hardcoded English — they weren't flagged by the lint rule (labels passed as JS object properties, not JSX text) and the Admin panel has no locale-toggle UI at all, so Admin-side navigation stays English-only regardless of locale. Left out of this pass's bounded scope; flagged here for a follow-up.

**Checkpoint**: No hardcoded user-facing strings remain outside the i18n layer; the lint rule guards against regression.

---

## Phase 7: User Story 4 - Admin Completes the Service Catalog Without Engineering Help (Priority: P1)

**Goal**: Admin manages categories, services, add-ons, images, pricing, activation, and ordering entirely through the UI.

**Independent Test**: Starting from an empty/partial catalog, create a category, add services/add-ons, attach images, configure pricing, set order, and activate everything — with the result immediately bookable — with no direct database or code change.

- [X] T042 [P] [US4] Create `apps/web/src/api/serviceCategoriesApi.ts` (RTK Query slice for the existing `GET/POST/PATCH/DELETE /service-categories` endpoints) — also added an Admin-only `includeInactive` query flag to the backend `GET /service-categories` (via `tryAuthenticate`, honored only when `req.user?.role === "ADMIN"`), since the Admin UI needs to see disabled categories too and no such flag existed before
- [X] T043 [P] [US4] Create `apps/web/src/api/serviceAddOnsApi.ts` (RTK Query slice for the existing `/service-add-ons` endpoints) — same `includeInactive` addition as T042, applied to `GET /service-add-ons`
- [X] T044 [P] [US4] Extend `apps/web/src/api/servicesApi.ts` with update/reorder/activate mutations against the existing `/services` endpoints — same `includeInactive` addition as T042/T043, applied to `GET /services`; added `active`/`includeInactive`-aware fields to the shared `Service`/`ServiceCategory`/`ServiceAddOn` frontend types
- [X] T045 [US4] Create `apps/web/src/admin/pages/catalog/Categories.tsx` (create/edit/reorder/deactivate UI; depends on T042) — reorder swaps `sortOrder` with the adjacent row via two `PATCH` calls (no dedicated bulk-reorder endpoint needed, since `sortOrder` was already writable)
- [X] T046 [US4] Create `apps/web/src/admin/pages/catalog/Services.tsx` (create/edit/reorder/activate UI; depends on T044) — ~~reorder~~ not implemented for Services: unlike `ServiceCategory`, the `Service` model has no `sortOrder` column, so reordering isn't backed by any field; adding one would be a schema change beyond this session's scope. Create/edit/activate are fully implemented.
- [X] T047 [US4] Create `apps/web/src/admin/pages/catalog/AddOns.tsx` (create/edit/reorder/activate UI, per-service assignment; depends on T043) — same `sortOrder`-less limitation as T046; create/edit/activate/per-service assignment fully implemented
- [X] T048 [US4] Create `apps/web/src/admin/pages/catalog/CatalogChecklist.tsx` — a completeness overview linking to T045–T047 plus the existing `ServiceImages.tsx`/`PricingRules.tsx` (FR-024) — checks pricing-configured/has-image/active per service from the single existing `listServices` payload (no N+1 fan-out), each unmet criterion deep-links to the relevant editor
- [X] T049 [US4] Wire `/admin/catalog/categories`, `/admin/catalog/services`, `/admin/catalog/add-ons`, `/admin/catalog/checklist` routes into `apps/web/src/app/router.tsx` and the Admin nav
- [X] T050 [US4] Add `ar`/`en` translation entries for all new catalog-management UI strings to `apps/web/src/locales/{ar,en}/catalog.json`
- [X] T051 [US4] Add `tests/e2e/admin-catalog-management.spec.ts`: create category → add service/add-on → upload image → set pricing → activate → verify bookable on `/services` — passes against chromium. ~~upload image~~ intentionally not exercised: `apps/api/src/lib/storage/factory.ts` requires a real S3-compatible endpoint with no local-disk fallback, out of scope alongside the rest of the deferred US9 external-storage work
- [X] T052 [US4] Verify deactivating a category/service/add-on removes it from `/services` immediately while existing bookings referencing it are unaffected (FR-025) — verified via the same e2e test (deactivate → `GET /services` no longer lists it); existing-booking preservation was already covered by the pre-existing `BookingItem` snapshot fields (`descriptionSnapshot`/`unitPriceSnapshot`/etc.), unaffected by this session's changes

**Checkpoint**: User Story 4 independently functional — full catalog lifecycle via UI only.

---

## Phase 8: User Story 5 - Admin-Managed Website Content Reaches the Public Site (Priority: P1)

**Goal**: Admin-edited content blocks and FAQ entries appear on the live public site in both locales, without a deployment.

**Independent Test**: Edit a content block/FAQ entry in both locales as Admin; confirm the public site reflects it, in the correct locale, with no deploy in between.

- [X] T053 [P] [US5] Create `apps/web/src/customer/pages/Faq.tsx` consuming the existing `apps/web/src/api/contentApi.ts` (`GET /faqs`), locale-aware — `contentApi.ts` only had the Admin-facing `/admin/faqs` endpoints, so also added `listPublicFaqs`/`listPublicContentBlocks` for the public `GET /faqs`/`GET /content-blocks` routes (already existed server-side, just unexposed in the frontend slice)
- [X] T054 [P] [US5] Create `apps/web/src/customer/pages/ServiceAreas.tsx` consuming the existing `GET /service-areas`
- [X] T055 [US5] Wire `apps/web/src/customer/pages/Home.tsx` to render `WebsiteContentBlock` (`type: SECTION`) entries from `contentApi` instead of its current static stub
- [X] T056 [US5] Add public (no `RequireAuth`) routes `/faq` and `/service-areas` to `apps/web/src/app/router.tsx` — also added nav links in `AppShell.tsx`
- [X] T057 [US5] Verify draft-state content blocks/FAQ entries are excluded from public rendering, and entries missing a translation fall back to Arabic (FR-028, Edge Cases) — `listActiveContentBlocks`/`listActiveFaqs` already filter `active: true` server-side; the write-side Zod schemas require every field non-empty so an actually-empty English string can't reach the DB via the Admin API, but the frontend still applies `en || ar` as defensive fallback rendering in `Faq.tsx`/`ServiceAreas.tsx`/`Home.tsx`
- [X] T058 [US5] Add `tests/e2e/public-content-and-faq.spec.ts`: Admin edits a content block/FAQ → public page (both `ar` and `en`) reflects it with no redeploy — 2 tests, both pass against chromium; discovered along the way that `lib/i18n.ts`'s explicit `lng` config bypasses the localStorage language-detector on initial load, so the English assertions had to switch locale via `AppShell`'s runtime toggle button (`i18n.changeLanguage()`) instead of a fresh navigation

**Checkpoint**: User Story 5 independently functional — Admin owns public content end to end.

---

## Phase 9: Public Page Prerendering (Cross-Cutting — supports FR-015–FR-017, SC-005)

**Purpose**: Needs US5's new public routes (`/faq`, `/service-areas`) to exist first, so it follows Phase 8.

- [ ] T059 Create `apps/web/src/entry-server.tsx` — a `renderToString` SSR entry over the existing route tree (research.md R10)
- [ ] T060 Create `apps/web/vite.ssr.config.ts` — SSR build target (research.md R10)
- [ ] T061 Create `apps/web/scripts/prerender.mjs` — build-time renderer for `/`, `/services`, `/services/:slug` (per active service), `/service-areas`, `/faq`, and `WebsiteContentBlock` `PAGE`-type routes, in both `ar`/`en`, writing to `apps/web/dist/<locale>/<route>/index.html`
- [ ] T062 Update `apps/web/package.json`'s `build` script to run `scripts/prerender.mjs` after `vite build`
- [ ] T063 Add an on-demand regeneration hook: catalog/pricing/service-area/content/FAQ Admin mutation endpoints in `apps/api/src/modules/{service-categories,services,service-add-ons,pricing-rules,service-areas,website-content}/service.ts` call T061's prerender function for the affected route(s) immediately after a successful write (FR-016)
- [ ] T064 Remove the now-resolved "added in Phase 3 (T079)" placeholder comment from `apps/web/vite.config.ts`
- [ ] T065 Verify the built `apps/web/dist/` contains real static HTML (not an empty shell) for `/`, `/services`, `/services/home-cleaning`, `/service-areas`, `/faq` in both locales, with correct per-locale hreflang/title/description metadata (FR-017)
- [ ] T066 Add `tests/e2e/prerender-smoke.spec.ts` — fetch a built/prerendered public route via raw HTTP (no JS execution) and assert primary content is present
- [ ] T067 Run `npm run lighthouse:ci` and confirm the existing `lighthouserc.json` thresholds (LCP/CLS/TBT/SEO) now pass against prerendered output

**Checkpoint**: Public pages are statically prerendered and stay fresh on Admin save.

---

## Phase 10: User Story 6 - Admin Manages Other Admin Accounts Safely (Priority: P2)

**Goal**: Admin can list, invite, create, suspend, reactivate, and reset access for other Admins, with the last active Admin always protected.

**Independent Test**: Invite a second Admin, confirm login works, suspend/reactivate it, reset its access, then confirm suspending the sole remaining active Admin is blocked.

### Tests for User Story 6

- [X] T068 [P] [US6] Add `apps/api/tests/integration/adminAccounts.test.ts` covering list/invite/create/suspend/reactivate/reset-credential/last-active-admin-protection (write first; confirm it fails before implementation) — 8 tests; also caught a real bug (passwordHash leaking in responses, fixed in T070 and re-verified here)

### Implementation for User Story 6

- [X] T069 [US6] Create `apps/api/src/modules/admin-accounts/schema.ts` (Zod schemas for invite/create/reset request bodies; contracts/admin-accounts.md)
- [X] T070 [US6] Create `apps/api/src/modules/admin-accounts/service.ts`: `listAdmins`, `inviteAdmin`, `createAdminDirectly`, `suspendAdmin` (guarded by `countActiveAdmins() > 1`), `reactivateAdmin`, `resetAdminCredential` (research.md R6; depends on T069, T010–T014) — added `toPublicAdmin()` sanitizer after integration tests caught raw Prisma `User` rows (including bcrypt `passwordHash`) leaking through invite/create/suspend/reactivate responses
- [X] T071 [US6] Create `apps/api/src/modules/admin-accounts/routes.ts`: `GET /admin/accounts`, `POST /admin/accounts/invite`, `POST /admin/accounts`, `POST /admin/accounts/:id/suspend`, `POST /admin/accounts/:id/reactivate`, `POST /admin/accounts/:id/reset-credential` (depends on T070)
- [X] T072 [US6] Register the admin-accounts router in `apps/api/src/app.ts`
- [X] T073 [P] [US6] Create `apps/web/src/api/adminAccountsApi.ts` RTK Query slice
- [X] T074 [US6] Create `apps/web/src/admin/pages/accounts/List.tsx`, `InviteDialog.tsx`, `ResetDialog.tsx` (depends on T073)
- [X] T075 [US6] Add an Admin-facing "Forgot password?" entry point to `apps/web/src/admin/pages/Login.tsx`, reusing the existing `authApi` forgot/reset-password endpoints (FR-036 self-service reset — no new backend endpoint needed)
- [X] T076 [US6] Wire `/admin/accounts` route into `apps/web/src/app/router.tsx` and the Admin nav
- [X] T077 [US6] Add `ar`/`en` translation entries for the new Accounts UI to `apps/web/src/locales/{ar,en}/admin.json`
- [X] T078 [US6] Add `tests/e2e/admin-accounts.spec.ts`: invite → set password → log in; suspend/reactivate; confirm suspending the last active Admin is blocked — passes against chromium (invite, direct-create-active-admin, suspend/reactivate cycle, last-active-admin 409 protection all verified)
- [X] T079 [US6] Confirm T068's integration test now passes — 19 integration test files / 56 tests pass (48 pre-existing + 8 new), re-verified after the `toPublicAdmin()` fix

**Checkpoint**: User Story 6 independently functional.

---

## Phase 11: User Story 7 - Background Jobs Run Reliably Without Duplication (Priority: P1)

**Goal**: The three existing jobs run every 15 minutes, never duplicate effects across overlapping runs, and log every outcome.

**Independent Test**: Let each job run on schedule against test data; confirm effects occur exactly once; force an overlapping run and confirm it safely no-ops with a clear log entry.

### Tests for User Story 7

- [X] T080 [P] [US7] Add `apps/api/tests/integration/jobs.test.ts` covering: each job produces the expected `JobRun` row; an overlapping invocation is `SKIPPED_LOCKED`; a forced failure is logged with `failureReason` (write first) — 4 tests; SKIPPED_LOCKED required a genuinely separate DB connection (`new PrismaClient()`) since `pg_try_advisory_lock` is reentrant within the same session/connection pool

### Implementation for User Story 7

- [X] T081 [US7] Finalize `apps/api/src/lib/jobs/scheduler.ts`'s `*/15 * * * *` registration for `expireStaleQuotes`, `flagOverdueBookings`, `generateSubscriptionOccurrences` (builds on Foundational T015/T016) — already in place from Foundational work
- [X] T082 [US7] Create `apps/api/src/modules/job-runs/routes.ts` — `GET /admin/job-runs` (filterable by `jobName`/`status`, paginated; contracts/health-and-jobs.md) — already in place from Foundational work
- [X] T083 [US7] Register the job-runs router in `apps/api/src/app.ts` — already in place from Foundational work
- [X] T084 [P] [US7] Create `apps/web/src/api/jobRunsApi.ts` and `apps/web/src/admin/pages/reports/JobRuns.tsx` (Admin job-health view)
- [X] T085 [US7] Wire `/admin/reports/job-runs` route into `apps/web/src/app/router.tsx` and the Admin nav
- [X] T086 [US7] Confirm T080's integration test now passes; leave the API running ~15+ minutes and confirm all three jobs produce `SUCCESS` runs automatically — the dev API had been running for hours; queried `GET /admin/job-runs` directly and confirmed 87 total runs, all three jobs consistently SUCCESS every 15 minutes since the scheduler started; UI manually verified in-browser (heading, table rows, status Tags all render correctly in the Arabic default locale)

**Checkpoint**: User Story 7 independently functional.

---

## Phase 12: User Story 8 - Notifications Actually Get Delivered (Priority: P1)

**Goal**: Booking- and Admin-account-event notifications send through real email/SMS providers; failures never block the underlying action.

**Independent Test**: Trigger a booking event and an Admin-account event; confirm real email/SMS delivery; stop the provider and confirm the underlying action still succeeds with a logged failure.

### Tests for User Story 8

- [ ] T087 [P] [US8] Add `apps/api/tests/integration/notifications.test.ts` covering `notify()` success (adapter called, `NotificationLog.status = SENT`) and failure (adapter throws, `status = FAILED` with `failureReason`, caller action still succeeds) (write first)

### Implementation for User Story 8

- [ ] T088 [US8] Update `apps/api/src/modules/bookings/service.ts` (~line 163, ~line 642) to call `notify()` (T014) with the customer's real email/phone instead of the current empty-`recipient` stub
- [ ] T089 [US8] Update `apps/api/src/modules/admin-accounts/service.ts`'s invite/reset flows (US6, T070) to call `notify({ channel: "EMAIL" })`
- [ ] T090 [P] [US8] Extend `apps/web/src/admin/pages/notifications/Log.tsx` to surface delivery status (sent/failed/pending) per booking/Admin-account action
- [ ] T091 [US8] Confirm T087's integration test now passes
- [ ] T092 [US8] Manually verify: confirm a booking, check the configured sandbox inbox/SMS log; stop the sandbox and repeat — booking still succeeds, `FAILED` log recorded (quickstart.md step 8)

**Checkpoint**: User Story 8 independently functional.

---

## Phase 13: User Story 9 - File Storage Works Against a Real Provider (Priority: P1)

**Goal**: Uploads verified end-to-end against a real S3-compatible provider, not only local/mocked storage.

**Independent Test**: Upload an image through the Admin interface against a real, configured S3-compatible provider; confirm it's retrievable and displays correctly on the public site.

- [ ] T093 [P] [US9] Add `apps/api/tests/integration/objectStorage.test.ts` uploading and retrieving a real file via `StorageAdapter.upload()` against a local MinIO instance (research.md R16; write first)
- [ ] T094 [US9] Confirm `apps/api/src/lib/storage/s3Adapter.ts` requires no code change to work against MinIO (env-var-only difference); document MinIO setup in `docs/deployment.md`
- [ ] T095 [US9] Verify `apps/api/src/lib/storage/factory.ts` surfaces a clear error (not a silent failure) when `OBJECT_STORAGE_*` is misconfigured
- [ ] T096 [US9] Confirm T093's integration test now passes

**Checkpoint**: User Story 9 independently functional.

---

## Phase 14: User Story 10 - Customer Requests a Reschedule, Admin Approves or Rejects (Priority: P2)

**Goal**: Customers can request a reschedule; Admin approves (applying the change via the existing `rescheduleBooking()`) or rejects, fully audited.

**Independent Test**: Submit a reschedule request as a test customer; walk it through Admin approval (schedule updates) and, separately, Admin rejection (schedule unchanged) — both audited.

### Tests for User Story 10

- [X] T097 [P] [US10] Add `apps/api/tests/integration/rescheduleRequests.test.ts` covering submit/approve (reuses `rescheduleBooking`)/reject/duplicate-pending-blocked/auto-reject-on-cancel (contracts/reschedule-requests.md; write first) — 6 tests; also caught a real bug (below)

### Implementation for User Story 10

- [X] T098 [US10] Create `apps/api/src/modules/reschedule-requests/schema.ts` (Zod schemas) — already in place from Foundational work
- [X] T099 [US10] Create `apps/api/src/modules/reschedule-requests/service.ts`: submit (ownership + state checks), approve (calls `apps/api/src/modules/bookings/service.ts`'s `rescheduleBooking()`), reject, auto-reject-on-cancel — already in place from Foundational work
- [X] T100 [US10] Create `apps/api/src/modules/reschedule-requests/routes.ts`: `POST /bookings/:id/reschedule-requests`, `GET /admin/reschedule-requests`, `POST /admin/reschedule-requests/:id/approve`, `POST /admin/reschedule-requests/:id/reject` — already in place from Foundational work
- [X] T101 [US10] Register the reschedule-requests router in `apps/api/src/app.ts` — already in place from Foundational work
- [X] T102 [US10] Add the auto-reject-on-cancel statement to the existing cancel transaction in `apps/api/src/modules/bookings/service.ts` (spec Edge Cases) — already in place from Foundational work
- [X] T103 [P] [US10] Create `apps/web/src/api/rescheduleRequestsApi.ts` RTK Query slice
- [X] T104 [US10] Add a "Request reschedule" action + dialog to `apps/web/src/customer/pages/BookingDetail.tsx` (depends on T103) — new `customer/pages/RescheduleDialog.tsx`, shown only when `status === CONFIRMED` and `scheduledStartAt` is in the future (mirrors the backend's own reschedulability check)
- [X] T105 [US10] Create `apps/web/src/admin/pages/reschedule-requests/List.tsx` (approval queue with approve/reject actions)
- [X] T106 [US10] Wire `/admin/reschedule-requests` route into `apps/web/src/app/router.tsx` and the Admin nav
- [X] T107 [US10] Add `ar`/`en` translation entries to `apps/web/src/locales/{ar,en}/customer.json` and `admin.json`
- [X] T108 [US10] Add `tests/e2e/reschedule-request.spec.ts`: submit → Admin approve (schedule updates) and, separately, submit → Admin reject (schedule unchanged), both with visible audit entries — 2 tests, both pass against chromium; audit entries are written server-side (`recordAuditEntry` in reschedule-requests/service.ts) but not separately asserted in the UI, matching this feature's existing audit-log pattern (verified via `apps/api/tests/integration/rescheduleRequests.test.ts` instead)
- [X] T109 [US10] Confirm T097's integration test now passes — passes as part of the full 21-file/66-test integration suite

**Bug found and fixed while writing T097's test**: `apps/api/src/modules/admin-accounts/routes.ts` registered its Admin-only guard as an unscoped `adminAccountsRouter.use(authenticate, requireRole("ADMIN"))`. Since Express routers fall through to later-mounted routers on a non-match, this blanket guard silently intercepted *any* request that fell through unmatched to that point in `app.ts`'s router chain — not just `/admin/accounts/*` — including this new `/bookings/:id/reschedule-requests` route (mounted later) and, more importantly, any genuinely-404 path. Fixed by scoping it to `adminAccountsRouter.use("/admin/accounts", authenticate, requireRole("ADMIN"))`. This also exposed a second, previously-masked issue in `tests/integration/authorization.test.ts` (its throwaway test router was mounted after `createApp()`'s own `errorHandler`, so its errors fell through to Express's default HTML error page instead of JSON) — fixed by giving that test its own minimal standalone app with the real `errorHandler`.

**Checkpoint**: User Story 10 independently functional.

---

## Phase 15: User Story 11 - The Platform Is Deployed, Monitored, and Recoverable (Priority: P1)

**Goal**: A documented, repeatable deployment with CI, backups, monitoring, health checks, error tracking, HTTPS, and a tested rollback.

**Independent Test**: Follow the documented procedure to stand up staging from clean state; confirm CI blocks a broken change; confirm a backup restores; confirm health/error-tracking report accurately; confirm rollback restores the previous version.

- [ ] T110 [P] [US11] Create `apps/api/Dockerfile` (multi-stage: build via existing `npm run build`, runtime `node:22-slim`)
- [ ] T111 [P] [US11] Create `apps/web/Dockerfile` (multi-stage: build via existing `npm run build` + prerender step, runtime `nginx:alpine` serving `dist/`)
- [ ] T112 [US11] Create root `docker-compose.yml` wiring `api` + `web` + `postgres:16` for staging (depends on T110–T111)
- [ ] T113 [P] [US11] Create `.github/workflows/ci.yml`: `lint`, `typecheck`, `test:web`, `test:api`, `test:integration` (with a `postgres:16` service container), `build`, `test:e2e` (with its own `postgres:16` service)
- [ ] T114 [P] [US11] Write `docs/deployment.md` (env variable table, staging/production procedure, HTTPS requirement)
- [ ] T115 [P] [US11] Write `docs/backup-restore.md` (backup schedule, tested restore procedure)
- [ ] T116 [P] [US11] Write `docs/rollback.md` (redeploy-previous-image-tag procedure; explicit handling of already-applied migrations per spec Edge Cases)
- [ ] T117 [US11] Verify `docker compose up --build` brings up a healthy `api`+`web`+`postgres` stack serving prerendered HTML (quickstart.md step 11)
- [ ] T118 [US11] Verify CI blocks a deliberately failing test/lint/typecheck change on a throwaway branch
- [ ] T119 [US11] Perform one documented backup + restore drill per `docs/backup-restore.md`
- [ ] T120 [US11] Perform one documented rollback drill per `docs/rollback.md`

**Checkpoint**: User Story 11 independently functional.

---

## Phase 16: User Story 12 - Final Production Acceptance Sign-Off (Priority: P1)

**Goal**: Security, accessibility, mobile, RTL/LTR, performance, SEO, privacy, and recovery all verified, with every launch-blocking finding resolved.

**Independent Test**: Run the full acceptance check against a staging environment reflecting every other completed story; confirm sign-off with zero unresolved launch-blocking findings.

- [ ] T121 [US12] Run a security review (authentication, authorization, input validation, secrets handling) against the `docker-compose` environment
- [ ] T122 [US12] Run `tests/e2e/accessibility.spec.ts` (`@axe-core/playwright`) across all public and booking-critical Admin flows; resolve any blocking WCAG 2.1 AA violations
- [ ] T123 [US12] Manually verify 360px-viewport usability across every public and booking-critical flow (no horizontal scroll)
- [ ] T124 [US12] Manually verify a full Arabic RTL functional pass and a full English LTR functional pass across every flow touched by this feature
- [ ] T125 [US12] Run `npm run lighthouse:ci` against the `docker-compose` environment and confirm Core Web Vitals thresholds pass
- [ ] T126 [US12] Verify SEO metadata/hreflang/sitemap correctness on all prerendered public pages
- [ ] T127 [US12] Verify data-privacy rules remain intact: booking-reference-only lookup protection, log redaction, export redaction (001 baseline)
- [ ] T128 [US12] Confirm T119/T120's backup/restore and rollback drills already succeeded; record sign-off with every launch-blocking finding from T121–T127 resolved (FR-075)

**Checkpoint**: All twelve user stories independently functional; launch sign-off recorded.

---

## Phase 17: Polish & Cross-Cutting Concerns

**Purpose**: Small leftovers that touch multiple stories.

- [ ] T129 [P] Update `specs/001-cleaning-company-platform/quickstart.md`'s "Build & Deploy Smoke Check" section to point at the new `docs/deployment.md`
- [ ] T130 [P] Run `npm run lint && npm run typecheck` across the whole repo and fix any residual issue introduced by this feature
- [ ] T131 Run the full `quickstart.md` validation guide end-to-end as a final sanity pass
- [ ] T132 [P] Remove the now-obsolete "populated once the templating module resolves..." comment and any other stub-era dead comments in `apps/api/src/modules/bookings/service.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS every phase below.
- **US1, US2, US3 (Phases 3–5)**: Depend only on Foundational; independent of each other and of every later phase.
- **i18n Cross-Cutting (Phase 6)**: Depends on Foundational (T020's namespace split); independent of US1–US3.
- **US4 (Phase 7)**: Depends on Foundational; benefits from Phase 6 being done first (new UI should follow the new i18n convention) but is not blocked by it.
- **US5 (Phase 8)**: Depends on Foundational; independent of US4.
- **Prerendering Cross-Cutting (Phase 9)**: Depends on US5 (Phase 8) — needs `/faq` and `/service-areas` to exist as routes to prerender.
- **US6, US7, US8, US9 (Phases 10–13)**: Each depends only on Foundational (T007–T020 already provide their schema/adapter/scheduler prerequisites); independent of each other and of US4/US5/Phase 6/Phase 9.
- **US10 (Phase 14)**: Depends on Foundational (T007's `RescheduleRequest` model) and, for its notification step, on US8's `notify()` being wired (Phase 12) — otherwise independent.
- **US11 (Phase 15)**: Benefits from every other story being substantially complete (it packages the whole app for deployment) but its Dockerfile/CI/docs tasks (T110–T116) can start as soon as Foundational is done; only the drill tasks (T117–T120) need the rest of the app to exist.
- **US12 (Phase 16)**: Depends on every other phase being complete — it is the final verification gate by design.
- **Polish (Phase 17)**: Depends on all desired phases being complete.

### Parallel Opportunities

- All `[P]` tasks within Setup (T002–T004, T006) run in parallel.
- Within Foundational, T010–T012 (adapter files) and T015 (lock file) run in parallel; T019 is independent of the notification/job chain.
- Once Foundational is done, **US1, US2, US3, Phase 6 (i18n), US4, US5, US6, US7, US8, US9** can all start in parallel if staffed — they share no files. US10 should wait for US8 if the team wants notifications working before testing reschedule-decision emails (not a hard blocker). Phase 9 (prerendering) waits for US5. US11's drill tasks and all of US12 come last.

---

## Parallel Example: Foundational Phase

```bash
Task: "Create apps/api/src/lib/notifications/index.ts defining EmailAdapter/SmsAdapter interfaces"
Task: "Create apps/api/src/lib/notifications/emailAdapter.ts — SMTP-based EmailAdapter implementation"
Task: "Create apps/api/src/lib/notifications/smsAdapter.ts — REST-based SmsAdapter implementation"
Task: "Create apps/api/src/lib/jobs/lock.ts — tryAdvisoryLock/releaseAdvisoryLock"
```

## Parallel Example: User Story 6

```bash
Task: "Add apps/api/tests/integration/adminAccounts.test.ts covering list/invite/create/suspend/reactivate/reset-credential/last-active-admin-protection"
Task: "Create apps/web/src/api/adminAccountsApi.ts RTK Query slice"
```

---

## Implementation Strategy

### Recommended sequencing (single team, in priority order)

1. Setup → Foundational (must be sequential and complete first).
2. US1 → US2 → US3 (environment and both test suites trustworthy before building more on top).
3. Phase 6 (i18n) → US4 → US5 → Phase 9 (prerendering) (catalog and content UI, then make it fast/crawlable).
4. US6, US7, US8, US9 (account management, jobs, notifications, storage — each independent, any order).
5. US10 (reschedule requests — benefits from US8's notifications existing).
6. US11 (deployment/CI/ops — package everything built so far).
7. US12 (final acceptance sign-off — verifies everything).
8. Polish.

### Parallel team strategy

Once Foundational is complete, split by story: one engineer on US1–US3 (verification-heavy, no new UI), one on Phase 6 + US4 + US5 + Phase 9 (frontend-heavy), one on US6/US7/US8/US9 (backend-module-heavy, all independent), one on US11 (ops/infra, can start Dockerfiles/CI immediately). Converge for US10 (needs US8), then US12 (needs everyone).

---

## Notes

- `[P]` tasks touch different files with no unmet dependency.
- Every new backend module (`admin-accounts`, `reschedule-requests`, `job-runs`) follows the existing `routes.ts`/`schema.ts`/`service.ts` layout already used by every sibling module in `apps/api/src/modules/`.
- Commit after each task or logical group; stop at any Checkpoint to validate a story independently before continuing.
- Avoid: skipping a Foundational task because a later story "seems" to not need it — T007–T020 are load-bearing for at least one of US6/US7/US8/US10.
