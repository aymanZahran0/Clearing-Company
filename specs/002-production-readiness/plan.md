# Implementation Plan: Production Readiness

**Branch**: `002-production-readiness` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-production-readiness/spec.md`

## Summary

This feature closes the gap between the `001-cleaning-company-platform` implementation (already merged: full booking/pricing/scheduling/execution/quality/subscription/payment domain model, Admin auth, WhatsApp-log/S3-adapter scaffolding) and a launchable production system. It does **not** introduce new architecture: everything below is additive work inside the existing `apps/web` (React 18 + Vite 5 SPA), `apps/api` (Express 4 + Prisma + PostgreSQL REST API), and `packages/shared` monorepo, plus new deployment/CI tooling at the repo root. Concretely: (1) verify/fix environments, migrations, and both test suites against real databases; (2) build the Admin catalog-management UI and public content/FAQ pages the backend already supports but nothing yet renders; (3) wire the three existing-but-unscheduled background jobs to `node-cron` with Postgres-advisory-lock-based mutual exclusion; (4) replace the stubbed WhatsApp-only notification write with real email + SMS provider adapters (mirroring the existing S3 adapter-factory pattern) while keeping WhatsApp manual; (5) add a new `RescheduleRequest` entity and customer/Admin endpoints on top of the existing `rescheduleBooking` transaction; (6) add Admin-account lifecycle endpoints reusing the already-present `User.status` enum; (7) add build-time + on-demand SSR-string prerendering for public routes using Vite's native SSR mode (no framework swap); (8) close the i18n gap (~29 of 40 Admin files and several customer files have hardcoded strings); (9) add Docker/GitHub-Actions/health-check/backup/Sentry/rollback operational tooling; (10) run the final acceptance checklist.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js ≥22 LTS (unchanged — `tsconfig.base.json`, `apps/api/package.json` engines).

**Primary Dependencies (existing, reused)**: React 18, Vite 5, React Router 6, Redux Toolkit/RTK Query, Ant Design, Tailwind, `react-i18next` (`apps/web`); Express 4, Prisma 5, Zod, `bcrypt`, `@aws-sdk/client-s3`, `helmet`, `express-rate-limit`, `pino`-style logging (`apps/api`); Vitest, `@testing-library/react`, Supertest-equivalent (Vitest + `supertest`), Playwright + `@axe-core/playwright` (test tiers); `@lhci/cli` (Lighthouse CI, already configured at `lighthouserc.json`).

**Primary Dependencies (new, additive only — no subsystem/architecture change)**:
- `node-cron` (`apps/api`) — in-process scheduler for the three existing job files.
- One email SDK behind an adapter interface (e.g. `nodemailer` for SMTP, or a specific provider SDK chosen at deploy time) and one SMS SDK behind an adapter interface (e.g. Twilio) — both follow the exact factory pattern already used by `apps/api/src/lib/storage/factory.ts`.
- `@sentry/node` (`apps/api`) and `@sentry/react` (`apps/web`) for error tracking.
- Docker (multi-stage `Dockerfile` per app) + `docker-compose.yml` for staging, GitHub Actions for CI — deployment/CI tooling, not application dependencies.
- A minimal Vite SSR entry (`apps/web/src/entry-server.tsx` + `apps/web/vite.ssr.config.ts`) using Vite's built-in SSR mode (already bundled with Vite 5, no new framework) for prerendering.

**Storage**: PostgreSQL 16+ (unchanged; `apps/api/prisma/schema.prisma`, currently one migration `20260714091905_init`), plus a real S3-compatible bucket (already implemented via `apps/api/src/lib/storage/s3Adapter.ts`, AWS SDK v3) verified end-to-end against a real provider (e.g. MinIO in CI, a real bucket in staging/production) instead of only unit-tested.

**Testing**: Vitest unit (`apps/api/vitest.config.ts`, `apps/web` equivalent) — unchanged; Vitest integration (`apps/api/vitest.integration.config.ts` + `apps/api/tests/setup.ts`, real Postgres, truncate-between-tests) — needs CI wiring (`npm run test:integration` is not currently chained into `npm run test`/`test:api`, and there is no `.github/workflows/` at all yet); Playwright (`playwright.config.ts`, `tests/e2e/*.spec.ts`) — needs new specs for reschedule-requests, Admin catalog management, Admin account management, public FAQ/content, and prerendered-route smoke checks.

**Target Platform**: Linux server / container host (Node 22 runtime for `apps/api`, static file serving + reverse proxy for `apps/web`'s built + prerendered output). No specific cloud vendor is fixed by this plan (spec Assumption #4); Docker images are the portable unit.

**Project Type**: Web application — unchanged two-deployable architecture (one SPA, one API service) against a single PostgreSQL database. No microservices, no message broker, no additional deployables are introduced.

**Performance Goals**: Reuse constitution Principle V thresholds (LCP < 2.5s, INP < 200ms, CLS < 0.1 on throttled mobile, already asserted in `lighthouserc.json` against `/`, `/services`, `/services/home-cleaning`) — currently at risk because those routes are pure client-rendered SPA shells; prerendering (item 7 above) is required to meet them, not optional polish.

**Constraints**: Exactly two roles (Customer, Admin) — Admin-account lifecycle work reuses `Role`/`UserStatus` enums already in `apps/api/prisma/schema.prisma`, no new role is added. Background jobs run every 15 minutes (spec clarification). Prerendered public pages regenerate on-demand, immediately on the triggering Admin save (spec clarification) — not a periodic rebuild. WhatsApp stays manual/click-to-chat (spec clarification) — no WhatsApp Business API integration. Must not replace the existing stack, must not recreate already-complete 001 modules (e.g. pricing engine, checklist snapshotting, subscription generation logic itself — only its scheduling/locking is new).

**Scale/Scope**: Single-city cleaning business booking volume (per 001 Assumptions); single Postgres instance, single API instance — no high-availability/multi-region requirement is implied or required by this feature (deferred per clarification session).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Production-Grade Code Quality | All new code (job scheduler, notification adapters, reschedule-request module, admin-account module, prerender entry) is TypeScript strict, Zod-validated at API boundaries via `packages/shared`-style schemas, covered by Vitest integration tests before merge. Money/scheduling paths (reschedule approval reuses `rescheduleBooking`'s existing transaction) are not touched in a way that weakens their fail-loud guarantees. | PASS |
| II. Mobile-First Responsive Design | New Admin catalog/account-management screens and the customer reschedule-request UI are built with the same Ant Design + Tailwind mobile-first patterns already used across `apps/web/src/admin` and `apps/web/src/customer`; no desktop-only screen is introduced. | PASS |
| III. Bilingual & RTL-Correct Internationalization | This feature explicitly targets and fixes the i18n gap found during codebase inspection (~29/40 Admin files, several customer files hardcode English strings). New screens ship with both locales translated before merge, per FR-011–FR-014. | PASS (gap is the work item, not a violation to accept) |
| IV. Accessibility & Phone-Booking Parity | New Admin screens follow existing `@axe-core/playwright` coverage patterns (`tests/e2e/accessibility.spec.ts`); no new customer flow bypasses Admin-assisted parity. | PASS |
| V. Performance & SEO by Default | Directly addressed by the prerendering work (FR-015–FR-017) and `lighthouserc.json`'s already-defined, currently-unmet thresholds. | PASS (implements the principle, doesn't relax it) |
| Technology & Platform Constraints | No new subsystem/microservice/message broker. `node-cron` runs in-process inside the existing `apps/api` deployable. Email/SMS adapters are libraries inside `apps/api`, chosen via env config exactly like the existing storage adapter. Docker/GitHub Actions are deployment/CI tooling around the existing two-deployable architecture, not a new runtime. | PASS |
| Development Workflow & Quality Gates | This feature adds the CI enforcement (`.github/workflows/ci.yml`) that currently doesn't exist, closing an existing gate gap rather than opening one. | PASS |

No violations requiring Complexity Tracking.

**Post-Phase-1 re-check**: `research.md` and `data-model.md` confirm the only new schema is two small, additive tables (`RescheduleRequest`, `JobRun`); every other capability reuses existing models/endpoints or adds libraries inside the existing two apps. No gate result above changes after design.

## Project Structure

### Documentation (this feature)

```text
specs/002-production-readiness/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── reschedule-requests.md
│   ├── admin-accounts.md
│   ├── health-and-jobs.md
│   └── notification-provider.md
└── tasks.md             # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

Existing structure, unchanged (npm workspaces monorepo):

```text
apps/api/
├── prisma/
│   ├── schema.prisma                     # append new models here (RescheduleRequest, JobRun)
│   ├── migrations/20260714091905_init/   # existing single migration
│   └── seed.ts                           # extend: seed WebsiteContentBlock/FaqItem rows
├── src/
│   ├── app.ts                            # register new routers here
│   ├── server.ts                         # start node-cron scheduler here
│   ├── jobs/                             # existing: expireStaleQuotes.ts, flagOverdueBookings.ts,
│   │                                      #   generateSubscriptionOccurrences.ts — wrap, don't rewrite
│   ├── lib/
│   │   ├── storage/{factory,s3Adapter,index}.ts   # existing pattern to mirror
│   │   ├── notifications/                # NEW: emailAdapter.ts, smsAdapter.ts, factory.ts, index.ts
│   │   ├── jobs/                         # NEW: scheduler.ts, lock.ts
│   │   └── monitoring/                   # NEW: sentry.ts
│   └── modules/
│       ├── notifications/service.ts      # existing: extend to actually send, not just log
│       ├── bookings/service.ts           # existing rescheduleBooking() — reused by reschedule-requests approval
│       ├── auth/service.ts               # existing forgotPassword/resetPassword — reused for Admin self-service
│       ├── admin-accounts/               # NEW: routes.ts, schema.ts, service.ts
│       └── reschedule-requests/          # NEW: routes.ts, schema.ts, service.ts
└── tests/
    ├── setup.ts                          # existing real-DB truncate helper — reused as-is
    └── integration/                      # add: adminAccounts.test.ts, rescheduleRequests.test.ts,
                                           #   jobs.test.ts, notifications.test.ts

apps/web/
├── vite.config.ts                        # existing (client build) — comment already flags this feature
├── vite.ssr.config.ts                    # NEW: SSR build config for prerendering
├── scripts/prerender.mjs                 # NEW: build-time + on-demand static HTML generation
├── src/
│   ├── entry-client.tsx                  # NEW (rename from existing main.tsx pattern if needed)
│   ├── entry-server.tsx                  # NEW: SSR render entry
│   ├── app/router.tsx                    # existing — add routes for ServiceAreas, Faq, reschedule request,
│                                          #   admin catalog Categories/Services/AddOns, admin accounts
│   ├── api/                              # existing RTK Query slices — add adminAccountsApi.ts,
│                                          #   rescheduleRequestsApi.ts; contentApi.ts already exists, unused today
│   ├── admin/pages/catalog/              # existing: ChecklistTemplateEditor.tsx, ServiceImages.tsx
│                                          # NEW: Categories.tsx, Services.tsx, AddOns.tsx
│   ├── admin/pages/accounts/             # NEW: List.tsx, InviteDialog.tsx, ResetDialog.tsx
│   ├── customer/pages/ServiceAreas.tsx   # NEW — consumes existing GET /service-areas
│   ├── customer/pages/Faq.tsx            # NEW — consumes existing contentApi (GET /faqs)
│   ├── customer/pages/Home.tsx           # existing stub — wire to contentApi content blocks
│   ├── customer/pages/BookingDetail.tsx  # existing — add "Request reschedule" action
│   └── locales/{ar,en}/common.json       # existing, 35 lines each — expand to cover full app,
│                                          #   likely split into per-area namespaces
└── tests/unit/                           # add coverage for new components

tests/e2e/                                # existing 10 specs — add: reschedule-request.spec.ts,
                                          #   admin-catalog-management.spec.ts, admin-accounts.spec.ts,
                                          #   public-content-and-faq.spec.ts, prerender-smoke.spec.ts

.github/workflows/ci.yml                  # NEW — lint, typecheck, unit, integration (with postgres service),
                                          #   e2e (with postgres service), build
Dockerfile (apps/api/Dockerfile, apps/web/Dockerfile)   # NEW — multi-stage builds
docker-compose.yml                        # NEW — staging composition (api + web + postgres)
docs/deployment.md, docs/rollback.md, docs/backup-restore.md   # NEW — ops runbooks
```

**Structure Decision**: Pure addition to the existing two-workspace-app monorepo (`apps/web`, `apps/api`, `packages/shared`) plus root-level deployment/CI files. No new app or package is created; no existing directory is restructured. Every new backend capability follows an existing sibling module's file layout (`routes.ts` / `schema.ts` / `service.ts`) so the codebase stays internally consistent.

## Complexity Tracking

*No Constitution Check violations — table omitted.*
