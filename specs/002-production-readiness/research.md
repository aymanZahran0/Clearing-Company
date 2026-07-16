# Phase 0 Research: Production Readiness

**Input**: `spec.md` (14 outcome areas, 3 resolved clarifications) + explicit `/speckit-plan` direction to reuse the existing stack and reference exact repository paths, grounded in direct inspection of `apps/web`, `apps/api`, and `packages/shared` as they exist today (post-001).

Each item states what already exists (so it is not rebuilt) before stating the new decision.

---

## R1. Background Job Scheduling Mechanism

**Existing**: `apps/api/src/jobs/expireStaleQuotes.ts`, `flagOverdueBookings.ts`, `generateSubscriptionOccurrences.ts` are fully implemented and idempotent (subscription job backstopped by the `@@unique([subscriptionId, occurrenceDate])` constraint on `Booking`; overdue job dedupes via an `AuditLog` lookup per calendar day) but are **only invoked from tests** today — `apps/api/src/server.ts` starts Express and nothing else; no cron/scheduler dependency exists anywhere in the repo.

**Decision**: Add `node-cron` to `apps/api`. Create `apps/api/src/lib/jobs/scheduler.ts` that registers all three jobs on a `*/15 * * * *` cron expression (spec clarification: every 15 minutes) and starts them from `apps/api/src/server.ts` after the HTTP server is listening. Each job invocation is wrapped by a lock helper (R2) and writes a `JobRun` row (data-model.md) before/after execution.

**Rationale**: `node-cron` is a small, dependency-light in-process scheduler — no new deployable, no message broker, consistent with the constitution's two-deployable constraint. Running the scheduler inside the existing API process (rather than a separate worker) avoids introducing a fourth thing to deploy/monitor for three lightweight, fast (< few-second) jobs at this business's scale.

**Alternatives considered**: OS-level cron calling a script/HTTP endpoint (rejected — adds an external, undocumented dependency on the host's cron daemon, harder to test and to lock correctly across instances). A dedicated worker process/queue (e.g. BullMQ + Redis) (rejected — introduces a new subsystem and a new datastore for three simple periodic jobs; disproportionate to scale/scope and would need Complexity Tracking justification the work doesn't warrant).

---

## R2. Job Locking / Duplicate-Execution Protection

**Existing**: No lock table or advisory-lock usage exists anywhere in `apps/api/src`. The subscription job's only protection is the DB unique constraint (prevents duplicate *rows*, not duplicate concurrent *runs*).

**Decision**: Use PostgreSQL session-level advisory locks (`pg_try_advisory_lock(hashtext(jobName))` / `pg_advisory_unlock`) taken at the start of each job invocation in `apps/api/src/lib/jobs/lock.ts`. If the lock is already held, the invocation logs a `JobRun` row with `status = SKIPPED_LOCKED` and returns immediately — no work is attempted. The lock is released in a `finally` block regardless of success/failure.

**Rationale**: Advisory locks live in the same PostgreSQL instance already required by the app (no new infrastructure), are automatically released if the holding connection dies (no orphaned-lock risk that a hand-rolled "lock row" table would have), and are the standard Postgres-native pattern for this exact problem.

**Alternatives considered**: A `JobLock` table with a unique constraint + manual expiry (rejected — reinventing what advisory locks already do, with an added stale-lock-cleanup problem). Redis-based locks (rejected — new datastore dependency for no added benefit here).

---

## R3. Real Email Notification Provider

**Existing**: `apps/api/src/modules/notifications/service.ts` only has `listTemplates`/`upsertTemplate`/`listLogs`/`listLogsForCustomer` — no send/dispatch function exists. `apps/api/src/modules/bookings/service.ts` (~line 163, ~line 642) writes `NotificationLog` rows with `channel: "WHATSAPP"`, `status: "PENDING"`, `recipient: ""` and a comment noting the templating/dispatch step was deferred. `NotificationChannel` enum already includes `EMAIL`.

**Decision**: Add `apps/api/src/lib/notifications/emailAdapter.ts` exporting an `EmailAdapter` interface (`send(input: { to: string; subject: string; bodyHtml: string; bodyText?: string }): Promise<void>`) with one concrete SMTP-based implementation (e.g. via `nodemailer`, configurable against any SMTP-speaking provider — Amazon SES, SendGrid, Mailgun, Postmark, or a local SMTP relay — through env vars `EMAIL_SMTP_HOST`/`EMAIL_SMTP_PORT`/`EMAIL_SMTP_USER`/`EMAIL_SMTP_PASSWORD`/`EMAIL_FROM_ADDRESS`). Selection happens in `apps/api/src/lib/notifications/factory.ts`, mirroring `apps/api/src/lib/storage/factory.ts`'s lazy-singleton-with-clear-503-if-unconfigured pattern exactly.

**Rationale**: SMTP is the lowest-common-denominator protocol every mainstream transactional-email provider supports, so the adapter is provider-agnostic by construction (spec Assumption #4 — vendor choice is an environment decision, not a scope decision) without needing a separate adapter class per vendor.

**Alternatives considered**: A vendor-specific SDK (e.g. `@aws-sdk/client-sesv2`) as the only implementation (rejected as the *sole* option — would tie the abstraction to one vendor's API shape; SMTP keeps the interface vendor-neutral while still allowing a vendor-SDK adapter to be added later behind the same interface if needed).

---

## R4. Real SMS Notification Provider

**Existing**: Same gap as R3 — `NotificationChannel.SMS` exists in the enum with no sender implementation anywhere.

**Decision**: Add `apps/api/src/lib/notifications/smsAdapter.ts` exporting an `SmsAdapter` interface (`send(input: { to: string; body: string }): Promise<void>`), with one concrete implementation calling a REST-based SMS provider (e.g. Twilio's HTTP API) configured via env vars (`SMS_PROVIDER_API_KEY`, `SMS_PROVIDER_API_SECRET`, `SMS_FROM_NUMBER`). Selected through the same `apps/api/src/lib/notifications/factory.ts` as R3.

**Rationale**: Consistent factory pattern for both new channels; keeps `apps/api/src/modules/notifications/service.ts` and `apps/api/src/modules/bookings/service.ts` calling one small internal API (`sendEmail`, `sendSms`) regardless of which vendor is configured per environment.

**Alternatives considered**: Re-using the email adapter's transport for SMS-via-email-gateway (rejected — unreliable deliverability and formatting for real SMS use cases).

---

## R5. Notification Failure Isolation

**Existing**: `apps/api/src/modules/bookings/service.ts` already writes `NotificationLog` rows inline with the booking action (a good existing pattern to extend, not replace).

**Decision**: Wrap every `sendEmail`/`sendSms` call (and the existing WhatsApp log-write) in a try/catch inside a single `notify(...)` helper in `apps/api/src/modules/notifications/service.ts` that (a) always writes/updates the `NotificationLog` row with `status: SENT|FAILED` and `failureReason` on catch, and (b) never rethrows past its own boundary. Callers (`bookings/service.ts`, the new `admin-accounts/service.ts` invite/reset flows) call `notify(...)` fire-and-forget-safe (awaited for log-write ordering, but its internal catch guarantees it never fails the caller's transaction).

**Rationale**: Directly implements FR-048/spec Edge Cases ("a failed notification attempt never prevents or rolls back the underlying booking action") using the same inline-call shape the codebase already established, rather than introducing a queue/outbox pattern that would be new infrastructure for a requirement the existing shape already satisfies once adapters exist.

**Alternatives considered**: Transactional outbox + separate dispatcher process (rejected — real added complexity/new infra for a guarantee already achievable with a try/catch, given notifications are not required to be transactionally exactly-once).

---

## R6. Admin Account Lifecycle

**Existing**: `apps/api/prisma/schema.prisma`'s `User` model already has `role: Role` (`CUSTOMER`/`ADMIN`) and `status: UserStatus` (`ACTIVE`/`INVITED`/`SUSPENDED`) — built for this. `apps/api/src/modules/auth/service.ts` (~line 92-94) already rejects login for `SUSPENDED` users. `apps/api/src/modules/customers/service.ts`'s `createInvitedCustomer` (~line 81) shows the exact "no password yet, status INVITED" pattern already used for one role. Generic `forgotPassword`/`resetPassword` already exist in the auth module and work for any `User` row by email — this already covers Admin **self-service** reset (spec clarification 1) with no backend change, only a missing Admin-facing UI page.

**Decision**: Add `apps/api/src/modules/admin-accounts/{routes,schema,service}.ts` with: `listAdmins()`, `inviteAdmin({ fullName, email })` (creates a `User` with `role: ADMIN`, `status: INVITED`, no `passwordHash`, then calls the R3 email adapter with a set-password link built on the existing `PasswordResetToken` mechanism), `createAdminDirectly({ fullName, email, password })` (status `ACTIVE` immediately), `suspendAdmin(id)`, `reactivateAdmin(id)`, `resetAdminCredential(id)` (Admin-mediated — invalidates old credential, issues a new `PasswordResetToken`, emails it). Every mutating action writes an `AuditLog` row (existing model, existing pattern used across the codebase) and every suspend/deactivate/delete path first checks `countActiveAdmins() > 1` before proceeding, else throws a 409 with a clear message (FR-037).

**Rationale**: Zero schema changes needed for status/role — the two-role, invite/active/suspended shape was already built generically enough in 001 to cover Admin, it just was never exposed for Admin-managing-Admin. This is the leanest possible implementation of Outcome 8.

**Alternatives considered**: A separate `AdminAccount` table distinct from `User` (rejected — `User` already models exactly this shape; a parallel table would duplicate `status`/auth fields and require reconciling two identity tables for no benefit).

---

## R7. Customer Reschedule-Request Workflow

**Existing**: `apps/api/src/modules/bookings/service.ts`'s `rescheduleBooking()` (~line 431) already implements the hard part: capacity-checked slot transition, `CONFIRMED → RESCHEDULED → CONFIRMED` status dance inside a `$transaction`, two `BookingStatusHistory` rows. It is reachable only via `POST /bookings/:id/reschedule`, gated `authenticate` + `requireRole("ADMIN")` (`apps/api/src/modules/bookings/routes.ts:160-172`) — there is no customer-facing path and no concept of a request awaiting approval.

**Decision**: Add a new `RescheduleRequest` model (data-model.md) and `apps/api/src/modules/reschedule-requests/{routes,schema,service.ts}` with: `POST /bookings/:id/reschedule-requests` (customer-authenticated, ownership-checked against `booking.customerId === req.user.customerProfile.userId`, rejects if a `PENDING` request already exists for that booking — FR-057), `GET /admin/reschedule-requests` (Admin, filterable by status), `POST /admin/reschedule-requests/:id/approve` (Admin — calls the **existing** `rescheduleBooking()` with the requested date/time, then marks the request `APPROVED`), `POST /admin/reschedule-requests/:id/reject` (marks `REJECTED` with a reason, booking untouched). All four write `AuditLog` rows.

**Rationale**: Reuses the existing, already-tested slot-capacity and status-transition logic verbatim for the actual reschedule mechanics — the new module is purely the request/approval envelope around it, which is the smallest correct implementation and avoids duplicating booking-state logic.

**Alternatives considered**: Overloading `BookingStatus` with a new `RESCHEDULE_REQUESTED` enum value (rejected — `RESCHEDULED` is already a transient sub-state of the existing Admin-reschedule transaction; conflating "customer asked" with "Admin is mid-transaction" would make the enum ambiguous and break the existing `rescheduleBooking()` transition logic's assumptions).

---

## R8. Admin Catalog-Management UI

**Existing**: Backend is **complete** — `apps/api/src/modules/service-categories/{routes,schema,service}.ts`, `apps/api/src/modules/services/*`, `apps/api/src/modules/service-add-ons/*` already expose full create/update(including `sortOrder`, `active`)/disable endpoints (confirmed by reading `service-categories/routes.ts` and `schema.ts`). `apps/web/src/admin/pages/catalog/` only has `ChecklistTemplateEditor.tsx` and `ServiceImages.tsx` — no category/service/add-on CRUD screens exist, and `apps/web/src/app/router.tsx` has no routes for them.

**Decision**: Frontend-only work. Add `apps/web/src/api/serviceCategoriesApi.ts`, extend `apps/web/src/api/servicesApi.ts` and add `serviceAddOnsApi.ts` (RTK Query slices following the existing `pricingRulesApi.ts`/`discountCodesApi.ts` pattern), and three new pages: `apps/web/src/admin/pages/catalog/Categories.tsx`, `Services.tsx`, `AddOns.tsx`, each with a create/edit form, an active/inactive toggle, and drag-or-button-based reorder writing `sortOrder` via the existing `PATCH` endpoints. Add a `apps/web/src/admin/pages/catalog/CatalogChecklist.tsx` overview page (FR-024) that queries all three plus `ServiceImages`/`PricingRules` completeness per item and deep-links to the relevant editor. Wire all four into `apps/web/src/app/router.tsx` and the Admin nav.

**Rationale**: No backend risk — this is UI work against an already-shipped, already-tested API surface.

**Alternatives considered**: Building a single generic "catalog admin" CRUD table component parameterized by entity (rejected as premature abstraction for exactly three similar-but-not-identical entities — three concrete pages are simpler to read and modify independently, consistent with the "no premature abstraction" engineering guidance).

---

## R9. Public Content, FAQ, and Service-Areas Pages

**Existing**: Backend is **complete** — `apps/api/src/modules/website-content/routes.ts` exposes public, unauthenticated `GET /content-blocks` and `GET /faqs` plus full Admin CRUD, already consumed by `apps/web/src/admin/pages/content/{WebsiteContent,FAQs}.tsx` via `apps/web/src/api/contentApi.ts`. No customer-facing page imports `contentApi` today. `apps/web/src/customer/pages/Home.tsx` is a bare stub. No public Service Areas page exists (`GET /service-areas` already exists per `apps/api/src/modules/service-areas`, from the 001 baseline, but is unconsumed on the public site).

**Decision**: Add `apps/web/src/customer/pages/Faq.tsx` (renders `FaqItem[]` from `contentApi`, locale-aware per FR-028) and `apps/web/src/customer/pages/ServiceAreas.tsx` (renders active `ServiceArea[]`). Wire `Home.tsx` to render `WebsiteContentBlock` entries of `type: SECTION` for its key sections instead of static markup. Add both new routes (`/faq`, `/service-areas`) to `apps/web/src/app/router.tsx` as public (no `RequireAuth`) routes, alongside the existing public `/`, `/services`, `/services/:slug`.

**Rationale**: Same shape as R8 — pure frontend consumption of an already-correct, already-secured public API.

---

## R10. Static Prerendering of Public Pages

**Existing**: `apps/web/vite.config.ts` has an explicit placeholder comment: *"Public-route prerendering (research.md R9) is added in Phase 3 (T079) once the public route tree exists. This base config covers dev/build/test only."* — i.e., this was foreseen and deliberately deferred, not overlooked. `apps/web/dist/index.html` today is an empty SPA shell. `lighthouserc.json` already asserts LCP/CLS/TBT/SEO thresholds against `/`, `/services`, `/services/home-cleaning` that a pure client-rendered shell will struggle to pass.

**Decision**: Use Vite's built-in SSR mode (bundled with Vite 5, no new framework/dependency) to render each public route's initial HTML. Add `apps/web/src/entry-server.tsx` (a `render(url, locale)` function using `ReactDOMServer.renderToString` over the existing route tree/components — no component rewrite needed, since React 18 components render identically server- and client-side as long as they avoid browser-only globals at module scope, which the existing public pages already do). Add `apps/web/vite.ssr.config.ts` (SSR build target). Add `apps/web/scripts/prerender.mjs`, a Node script that: (a) at full build time, renders every public route (`/`, `/services`, `/services/:slug` for each active service, `/service-areas`, `/faq`, plus `WebsiteContentBlock` pages of `type: PAGE`) in both `ar` and `en`, writing static HTML to `apps/web/dist/<locale>/<route>/index.html`; (b) exposes an internal `regenerateRoute(routes: string[])` function. Admin mutation endpoints for catalog (`service-categories`, `services`, `service-add-ons`), pricing display, service areas, content blocks, and FAQs each call a small internal HTTP hook (`POST` to a `apps/api`-side endpoint that shells out to `node apps/web/scripts/prerender.mjs --routes=...`, or an in-process call if the prerender script is loaded as a library) immediately after a successful write, satisfying the "immediate, on-demand" freshness requirement (FR-016) without a periodic rebuild loop. The production web server (Nginx or equivalent, per R14) serves the static prerendered HTML for public routes when present, falling back to the SPA shell (which then hydrates) for everything else.

**Rationale**: Vite's SSR mode is already part of the installed toolchain (no new framework like Next.js/Remix, honoring "do not replace the current stack"), and rendering to a string is exactly what "static prerendering... present without requiring client-side JavaScript execution" (FR-015) requires. On-demand regeneration triggered directly from the Admin mutation path (rather than a timer) is the only way to honor the "immediate" clarification.

**Alternatives considered**: A third-party prerender service/headless-browser snapshotting tool (e.g. Prerender.io, Puppeteer-based crawling) (rejected — adds an external dependency/subsystem and is slower/heavier than directly rendering React server-side, which Vite already supports natively). A periodic (e.g. every-N-minutes) rebuild job (rejected — spec clarification explicitly chose immediate/on-demand over a refresh window).

---

## R11. i18n Completion Audit & Guardrail

**Existing**: `apps/web/src/locales/{ar,en}/common.json` (35 lines each, ~20 keys, single `common` namespace) and `apps/web/src/lib/i18n.ts` (i18next + react-i18next + browser-language-detector, `fallbackLng: "ar"`). Direct inspection found only 11 of ~40 Admin page files use `useTranslation`/`t()` at all (concrete examples: `apps/web/src/admin/pages/bookings/List.tsx:29`, `NewPhoneBooking.tsx:100,130,173-174`, `apps/web/src/admin/pages/content/FAQs.tsx:30,39`, `apps/web/src/admin/pages/schedule/OperatingHours.tsx:48`, `apps/web/src/admin/pages/settings/SystemSettings.tsx:31`); customer pages are better but still leak strings (`apps/web/src/customer/pages/BookingWizard/QuoteReviewStep.tsx:53,58,63,71`, `apps/web/src/customer/pages/PublicBookingLookup.tsx:24`). This is a real, sizeable gap against constitution Principle III and spec FR-011, not a minor cleanup.

**Decision**: Split `apps/web/src/locales/{ar,en}/common.json` into per-area namespace files (e.g. `admin.json`, `customer.json`, `catalog.json`, `content.json`, keeping `common.json` for shared strings), matching the `apps/web/src/admin` / `apps/web/src/customer` directory split already in the codebase. Audit and replace every hardcoded literal found by a repo-wide grep sweep (`grep -rn ">[A-Za-z][a-zA-Z ]*<" apps/web/src` plus manual review of JSX attribute strings like `placeholder=`/`title=`) with `t()` calls, adding both `ar` and `en` entries for each. Add an ESLint rule (e.g. `eslint-plugin-i18next`'s `no-literal-string`, configured against `apps/web/src/**/*.tsx`) to `eslint.config.js` so newly introduced hardcoded strings fail `npm run lint` going forward, preventing regression.

**Rationale**: Namespacing by area keeps translation files reviewable (a 40-file, single flat JSON would be unwieldy); the lint rule is the only way to durably guarantee FR-011 ("no hardcoded literal UI text may remain") stays true after this feature ships, since a one-time audit alone would regress on the next unrelated PR.

**Alternatives considered**: Leaving one flat `common.json` (rejected — already only 35 lines for ~20 keys; scaling it to the full app's strings in one file would be unreviewable). Skipping the lint guardrail (rejected — a one-time fix without enforcement contradicts the constitution's "no hardcoded UI text" MUST, which is a standing requirement, not a one-time task).

---

## R12. Test-Database Wiring for CI (Integration Tests)

**Existing**: `apps/api/tests/setup.ts` already truncates all tables against a real PostgreSQL test database between tests (no mocking) and `apps/api/vitest.integration.config.ts` already exists and works locally. The gap: `npm run test:api` (root `package.json`) only runs `vitest run` (unit config), and `test:integration` (defined in `apps/api/package.json`) is not chained into any root script or any CI workflow — because no CI workflow exists yet.

**Decision**: No changes to the existing test code or setup helper. Add `test:integration` to the root `package.json`'s script list (`"test:integration": "npm run test:integration --workspace apps/api"`) and call it explicitly (not folded into `test:api`, so unit and integration remain separately runnable/timed) from `.github/workflows/ci.yml`, which provisions a `postgres:16` service container and points `DATABASE_URL` at it before running `prisma migrate deploy` then `test:integration`.

**Rationale**: The disposable-test-database mechanism (spec Outcome 2 / FR-005) is already fully built and correct; the only missing piece is CI plumbing, not new test infrastructure.

---

## R13. End-to-End Test Completion

**Existing**: `playwright.config.ts` already boots both `apps/api` and `apps/web` dev servers and health-checks the API before running. `tests/e2e/` has 10 specs covering the 001 baseline flows (customer booking, admin phone booking, confirmation/pricing, scheduling/capacity, execution/checklist, review/rework, subscriptions, reports, access-control-and-rtl, accessibility).

**Decision**: Add new specs for exactly the new/changed surface area this feature introduces: `tests/e2e/reschedule-request.spec.ts` (customer submits, Admin approves/rejects), `tests/e2e/admin-catalog-management.spec.ts` (R8), `tests/e2e/admin-accounts.spec.ts` (invite/suspend/reactivate/last-Admin-protection), `tests/e2e/public-content-and-faq.spec.ts` (R9), `tests/e2e/prerender-smoke.spec.ts` (fetches a built/prerendered public route with JS disabled or via raw HTTP and asserts primary content is present — verifies R10 rather than re-testing existing flows). No existing spec is rewritten; any found to be flaky/broken during Outcome 3 verification is fixed in place, not replaced.

**Rationale**: Matches spec User Story 3 exactly — verify what exists, add coverage only for what's new.

---

## R14. CI/CD, Containerization, and Deployment Target

**Existing**: No `.github/workflows/`, no `Dockerfile`, no `docker-compose.yml`, no deployment automation anywhere in the repo; `specs/001-cleaning-company-platform/quickstart.md` documents a manual build/start smoke check only.

**Decision**: Add `.github/workflows/ci.yml` (GitHub Actions, since the repo is git-based and this is the zero-cost, zero-new-account default for a repo not yet tied to another CI vendor) running, on every PR and push to `main`: `npm run lint`, `npm run typecheck`, `npm run test:web`, `npm run test:api` (unit), `npm run test:integration` (with a `postgres:16` service container, per R12), `npm run build`, and `npm run test:e2e` (with its own `postgres:16` service). Add `apps/api/Dockerfile` and `apps/web/Dockerfile` (multi-stage: build stage using the existing `npm run build` scripts, runtime stage `node:22-slim` for the API and an `nginx:alpine` static-file stage for the web app's built + prerendered `dist/`). Add root `docker-compose.yml` wiring `api` + `web` + a `postgres:16` service for a one-command staging environment. Hosting target itself (which cloud/VM the containers run on) is left as an environment choice (spec Assumption #4), documented generically in `docs/deployment.md`.

**Rationale**: GitHub Actions + Docker is the standard, low-friction default for a Node/Postgres web app with no existing CI/deployment vendor commitment, and keeps the "two-deployable architecture" constraint visible as two Dockerfiles rather than obscuring it behind a platform-specific buildpack.

**Alternatives considered**: A specific PaaS's native buildpacks (e.g. Render/Railway/Fly.io native config) instead of Dockerfiles (rejected — ties the plan to one vendor, contradicting spec Assumption #4's vendor-agnostic requirement; a Dockerfile is portable to any of them anyway, so it's a strict superset).

---

## R15. Backups, Monitoring, Error Tracking, Health Checks, Rollback

**Existing**: `GET /api/v1/health` already exists (`apps/api/src/app.ts:50`, referenced by `playwright.config.ts`'s `webServer` readiness check) but is a liveness-only check today (no DB connectivity check confirmed). No Sentry/error-tracking integration exists in either app's `package.json` or source.

**Decision**:
- **Health check**: Extend the existing `GET /api/v1/health` handler (`apps/api/src/app.ts`) to run a lightweight `SELECT 1` against Prisma and report `{ status: "ok" | "degraded", db: boolean }`, keeping the same path/URL so Playwright's existing readiness check keeps working unmodified.
- **Error tracking**: Add `@sentry/node` initialized early in `apps/api/src/server.ts` (DSN via `SENTRY_DSN` env var, no-op if unset) and `@sentry/react` initialized in `apps/web/src/entry-client.tsx` (`VITE_SENTRY_DSN`).
- **Backups**: Document (`docs/backup-restore.md`) a scheduled `pg_dump` (via the hosting provider's managed Postgres backup feature if available, else a cron-triggered `pg_dump` to the same S3-compatible bucket already integrated in R-existing storage work) and a tested `pg_restore` procedure.
- **Monitoring**: Extend the health check to be pollable by any uptime monitor (self-hosted or SaaS, vendor left open per spec Assumption #4) and add a `GET /admin/job-runs` endpoint (data-model.md `JobRun`) so Admin — and, by extension, an alerting rule reading it — can see job health (FR-064).
- **Rollback**: Document (`docs/rollback.md`) a containers-are-immutable-images rollback (redeploy the previous image tag) plus an explicit note on handling the case where a migration already ran forward (per spec Edge Cases: "the rollback procedure MUST address the database migration state explicitly") — i.e., only additive/backward-compatible migrations are deployed without a corresponding tested down-migration path documented per release.

**Rationale**: Reuses the existing health endpoint's URL (no breaking change for Playwright), Sentry is the de facto standard, cheapest-to-adopt error tracker with both Node and React SDKs, and documenting rollback against "redeploy previous image" is the natural consequence of the Docker-based deployment chosen in R14.

---

## R16. Real S3-Compatible Storage Verification

**Existing**: `apps/api/src/lib/storage/s3Adapter.ts` is a real AWS SDK v3 implementation (works against AWS S3, Cloudflare R2, MinIO, or any S3-compatible endpoint via `OBJECT_STORAGE_ENDPOINT`); `apps/api/src/lib/storage/factory.ts` throws a clear 503 if unconfigured. No test currently exercises it against a real (or realistic) provider — `apps/api/tests/integration/serviceImages.test.ts` likely only tests the HTTP route.

**Decision**: Add a MinIO service container to `.github/workflows/ci.yml` (S3-API-compatible, runs locally with no external account needed) and point `OBJECT_STORAGE_*` env vars at it for the integration test run, adding `apps/api/tests/integration/objectStorage.test.ts` that uploads a real file through `StorageAdapter.upload()` and confirms it's retrievable via the returned URL. Staging/production point the same adapter at whichever real S3-compatible vendor is chosen for that environment (unchanged code, only env vars differ).

**Rationale**: MinIO gives a genuinely real S3-protocol round trip in CI without requiring cloud credentials in the pipeline, directly satisfying "verify... using a real provider" (Outcome 11) without coupling CI to a paid external account.

---

## R17. Per-Locale Prerendering Output Structure

**Decision**: Prerendered static HTML is written per-locale (`apps/web/dist/ar/...`, `apps/web/dist/en/...`), matching the existing `mobile-ar`/`mobile-en` Playwright project split in `playwright.config.ts`, so locale-specific hreflang/meta tags (FR-017) and RTL/LTR markup are baked into the correct static file rather than negotiated at request time.

**Rationale**: Keeps prerendering consistent with the app's existing locale-testing convention and avoids a runtime content-negotiation layer that would itself need to be built and tested.
