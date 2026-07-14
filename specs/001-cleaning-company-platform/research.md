# Phase 0 Research: Nuqaa Asir Cleaning Booking & Operations Platform

**Input**: `spec.md` (business requirements, two-role model) + explicit technical direction supplied to `/speckit-plan`
**Purpose**: Resolve every technology/architecture decision needed before Phase 1 design, and reconcile the explicit `/speckit-plan` stack/status-model instructions against `spec.md` and `.specify/memory/constitution.md`.

All items below were **directed explicitly** by the user's `/speckit-plan` input rather than left open, so "Alternatives considered" documents why the stated choice is sound rather than presenting a live decision.

---

## R1. Monorepo Structure

**Decision**: npm/pnpm workspaces monorepo with `apps/web` (frontend), `apps/api` (backend), `packages/shared` (types, Zod schemas, constants, API contract types).

**Rationale**: Explicit user requirement. A shared package lets the frontend and backend import the same Zod validation schemas and TypeScript types, eliminating drift between client-side form validation and server-side request validation — critical given the pricing/booking-status logic must behave identically on both sides.

**Alternatives considered**: Single Next.js full-stack app (the architecture named in `.specify/memory/constitution.md`'s Technology & Platform Constraints and `.specify/plan.md`). Rejected for this plan because the user explicitly directed a decoupled Vite SPA + Express REST API instead. See **R9** for the constitutional deviation this creates and its mitigation.

**Package manager**: npm workspaces (built into npm 11+, already available in the target environment with no elevated-permission install step required). pnpm was the original preference for stricter dependency isolation, but installing it via `corepack enable` failed in this environment with `EPERM: operation not permitted` writing to the global Node install directory (requires admin rights not available here). npm workspaces achieve the same monorepo goal (shared `packages/shared` consumed by both apps via `workspace:*`-equivalent `file:` linking) without that dependency, so the switch is a tooling-availability decision, not an architectural one — revisit if a pnpm-capable environment becomes available.

---

## R2. Frontend Stack

**Decision**: React 18, Vite 5, TypeScript 5.x, React Router 6, Redux Toolkit + RTK Query, Tailwind CSS, Ant Design (`antd`).

**Rationale**: Explicit user requirement. RTK Query generates typed hooks directly from `packages/shared` API contract types, giving end-to-end type safety from Prisma → Zod → OpenAPI → RTK Query → React components. Tailwind handles utility-level layout/spacing; Ant Design supplies complex stateful components (tables, calendars, forms, date pickers) the admin dashboard needs, both configured for Arabic RTL.

**Alternatives considered**: Next.js (rejected — see R9). Plain CSS/MUI instead of Tailwind+AntD (rejected — explicit user requirement for this specific pairing).

**RTL & i18n**: `react-i18next` for string translation (Arabic default, English secondary), combined with Ant Design's built-in `ConfigProvider direction="rtl"` and Tailwind's `dir`-aware utilities (or `tailwindcss-rtl` plugin) so both component libraries mirror consistently. This satisfies constitution Principle III (logical properties, no hardcoded left/right).

**Why react-i18next specifically**: It is the de facto standard for React, has first-class RTL example configurations, and integrates cleanly with both Ant Design's locale provider and native `Intl` formatting needed for constitution FR on Saudi-locale dates/currency/phone numbers.

---

## R3. Backend Stack

**Decision**: Node.js 22 LTS, Express 4, TypeScript 5.x, Prisma ORM, PostgreSQL 16+, Zod (via `packages/shared` schemas), JWT access + refresh tokens, `helmet` for security headers, `express-rate-limit` for rate limiting, structured logging via `pino`, OpenAPI documentation authored in `contracts/openapi.yaml` (hand-authored/maintained rather than auto-generated, so it stays the single source of truth reviewed in PRs).

**Rationale**: Explicit user requirement for every item except the specific logging/rate-limiting/OpenAPI libraries, which are the standard, well-maintained choice for each stated capability (structured logging, rate limiting, security headers, API docs).

**Password hashing**: `bcrypt` (industry standard, native Node bindings available, sufficient work factor configurable via env var) — Customer and Admin accounts both use it.

**JWT strategy**: Short-lived access token (15 min) carried in the `Authorization: Bearer` header; long-lived refresh token (30 days) stored as an httpOnly, `Secure`, `SameSite=Strict` cookie, with a `RefreshToken` database table (hashed token, `revokedAt`, `replacedByTokenId`) enabling rotation-on-use and full revocation (e.g., on password reset or suspected compromise). This satisfies constitution security requirements (secure session handling) without adopting a third-party auth provider, since the user explicitly directed custom JWT auth over `.specify/plan.md`'s original "Auth.js or equivalent" suggestion.

**Alternatives considered**: Auth.js/NextAuth (rejected — tied to Next.js, and the user explicitly directed custom JWT). Session-cookie-only auth without JWT (rejected — user explicitly asked for access/refresh JWT, which also suits a decoupled SPA that may later need a mobile client).

---

## R4. Object Storage for Uploaded Service Images

**Decision**: S3-compatible object storage (provider selected at deployment time, e.g., AWS S3 or Cloudflare R2), accessed via a storage-adapter interface in `apps/api` so the concrete provider is swappable without touching business logic. Local disk storage only for local development.

**Rationale**: The "Uploaded service images" module (catalog photography, not the out-of-scope before/after job photos) needs durable, CDN-friendly storage. Matches constitution's "integrations added behind interfaces only when there is an immediate use case" simplicity gate — one adapter interface, one concrete implementation at launch.

**Alternatives considered**: Storing images as DB blobs (rejected — poor performance, no CDN caching, against constitution's simplicity/performance principles).

---

## R5. Booking Status Model Reconciliation

**Decision**: The `Booking.status` enum implements exactly the values the user specified: `DRAFT, PENDING, CONFIRMED, RESCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED, COMPLAINT_OPENED`. `spec.md`'s more granular business-lifecycle concepts (`NEEDS_REVIEW`, `QUOTED`, `CUSTOMER_APPROVED`, `SCHEDULED`, `EN_ROUTE`, `ARRIVED`, `QUALITY_REVIEW`, `NO_SHOW`, `REWORK_*`) are preserved as **sub-state data on the Booking record**, not as additional top-level statuses:

| spec.md concept | Where it lives in this plan |
|---|---|
| Requested / Needs review / Quoted / Customer approved | All represented by `status = PENDING`, distinguished by `Quote.status` and `Booking.requiresManualReview` |
| Confirmed | `status = CONFIRMED` |
| Scheduled (planned start/end + internal note) | `status = CONFIRMED` with `scheduledStartAt`/`scheduledEndAt`/`internalHandlingNote` populated (FR-029) |
| En route / Arrived / Started | `status = IN_PROGRESS`, distinguished by `enRouteAt` / `arrivedAt` / `startedAt` timestamps (FR-036, User Story 5) — each is its own nullable timestamp column, so the UI can still show "en route" vs. "arrived" vs. "in progress" as computed sub-states without a second status enum |
| Quality review | Represented by `ChecklistRun.reviewedAt` being null vs. set, while `status` remains `IN_PROGRESS` until review passes and `status` moves to `COMPLETED` |
| No-show | `status = CANCELLED` with `cancellationReason = "no_show"` (no fee per FR-040/clarification) |
| Rework required/scheduled/completed | Represented by a **new** `Booking` row with `originalBookingId` pointing at the source booking and `QualityIssue.reworkBookingId` linking back (FR-053); the rework booking runs through the same `DRAFT → … → COMPLETED` lifecycle independently |
| Rejected | New terminal status not explicit in spec.md's lifecycle diagram but consistent with FR-034 ("cannot be confirmed without required fields") and the plan's explicit Admin "confirm or reject" action — used when Admin declines a `PENDING` request outright (e.g., unserviceable, unrealistic) |
| Complaint opened | New status applied to a `COMPLETED` booking that has an open `QualityIssue`; distinct from `CANCELLED`/`REJECTED` since the work was delivered but is under dispute |

**Rationale**: Honors the user's explicit, simpler status enum (suited to a Kanban-style admin board) while losing none of the auditable granularity `spec.md` requires (FR-033, FR-036, FR-038 — every transition and every timestamp is still recorded, just via dedicated columns/child records instead of extra top-level enum values).

**Alternatives considered**: Implementing spec.md's full 11-state primary enum verbatim (rejected — directly contradicts the user's explicit `/speckit-plan` status list). Dropping the granular timestamps entirely (rejected — would violate FR-036 and User Story 5's acceptance criteria).

---

## R6. Guest Booking vs. Required Customer Accounts

**Decision**: The **web self-service Customer Portal** requires an account (register/login per the user's explicit Customer Portal feature list). The **Admin-assisted phone/WhatsApp channel** (User Story 2) continues to allow Admin to create a `CustomerProfile` and `Booking` without that customer ever setting a password, satisfying FR-016 ("System MUST NOT require a customer to create a permanent account in order to submit a booking request") for that channel specifically.

**Rationale**: `spec.md` Assumption 3 was written before this `/speckit-plan` call specified "Register, log in, and reset password" as the first Customer Portal capabilities. Since the instruction is explicit and deliberate, the web flow now requires an account; FR-016 remains satisfied because it is scoped to "a customer" submitting "a booking request" in general — the phone/WhatsApp/Admin-assisted path (which is how FR-016/FR-018/User Story 2 exist at all) still needs no account. A `User` row created by Admin has `passwordHash = null` and `status = 'INVITED'` until/unless that customer later sets a password (e.g., via a "claim your account" link sent by Admin), letting the same person later log into the Customer Portal and see their Admin-created booking history.

**Alternatives considered**: Pure guest checkout with no accounts at all (rejected — contradicts explicit "Register, log in" requirement). Mandatory account for every channel including phone bookings (rejected — directly contradicts FR-016/FR-018, which are unambiguous spec requirements this plan must not violate).

---

## R7. Pricing Model

**Decision**: `Service.pricingType` enum (`FIXED, PROPERTY_SIZE, HOURLY, QUANTITY, CUSTOM_QUOTE`) drives which calculation path a `Quote` uses; `PricingRule` rows layer conditional adjustments (property type, area band, day/time, condition modifiers) on top of the base calculation; `DiscountCode` and subscription pricing apply last. Every `Booking` stores an immutable price breakdown (`subtotalSnapshot`, `discountSnapshot`, `travelFeeSnapshot`, `taxSnapshot`, `totalSnapshot`) at confirmation time (FR-024).

**Rationale**: Directly matches the user's explicit pricing list (fixed/property-size/hourly/quantity/custom quotation/add-ons/travel fees/discount codes/subscription discounts) and FR-024's snapshot-immutability requirement.

**Alternatives considered**: Calculating price live from current catalog data at report/display time (rejected — violates FR-024 and FR-063, which require snapshots so historical revenue is stable).

---

## R8. Testing Strategy

**Decision**: `apps/web` — Vitest + React Testing Library for component/unit tests. `apps/api` — Vitest + Supertest for route/integration tests against a test PostgreSQL database. End-to-end — Playwright, driving both apps together, covering the flows the user listed (registration, login, booking, admin confirmation, payment recording, cancellation, completion, review, complaint) plus the Arabic/RTL and mobile-viewport smoke tests constitution Principle II/III/IV require.

**Rationale**: Vitest+RTL and Vitest+Supertest were explicit user requirements. Playwright is added for E2E because the user asked for E2E coverage of specific workflows without naming a runner; Playwright is the tool already validated in `.specify/plan.md` and integrates with both Vite and Express without additional adapters.

**Alternatives considered**: Cypress for E2E (rejected — no material advantage here, and Playwright was already the project's prior choice, avoiding an unnecessary tooling change).

---

## R9. Constitution Deviations Introduced by This Plan

Two deviations from `.specify/memory/constitution.md` are introduced by the user's explicit technical direction. Both are carried into `plan.md`'s Complexity Tracking table with justification, per constitution governance rules.

1. **Decoupled Vite SPA instead of a single Next.js full-stack app.** The constitution's Technology & Platform Constraints section names Next.js/React/Prisma specifically. This plan uses Express + Prisma for `apps/api` and a Vite-built React SPA for `apps/web` instead. This still satisfies the constitution's Simplicity principle (one deployable API, one deployable static frontend, no microservices, one relational database) — it changes *how many deployables* exist (two instead of one) but not the system's architectural complexity class.

2. **Public-page SEO/performance (constitution Principle V).** Principle V requires public marketing/catalog pages to be "server-rendered or statically generated" for Core Web Vitals and crawlability. A Vite-built React SPA is client-side-rendered by default, which would fail this gate for the public marketing site and service catalog. **Mitigation carried into this plan**: public, unauthenticated routes (home, service catalog, service detail, service-area, FAQ, commercial-contact) are pre-rendered at build time using a Vite prerendering plugin (e.g., `vite-plugin-ssr`'s SSG mode or `vite-plugin-prerender`), producing static HTML for those specific routes while the authenticated Customer Portal and Admin Dashboard remain a standard CSR SPA behind login (where SEO/CWV-on-first-load is not a requirement). This confines the SSR/SSG requirement to the small set of routes that actually need it, rather than forcing the whole app onto a server-rendering framework.

**Recommendation (non-blocking)**: After this plan is accepted, run `/speckit-constitution` again to update the Technology & Platform Constraints section so it reflects the actual chosen stack (Vite/Express monorepo) instead of the original Next.js suggestion, so future features aren't flagged against a stale constraint.

---

## R10. Rate Limiting & Security Headers

**Decision**: `express-rate-limit` applied per-route-group — stricter limits (e.g., 5 req/min) on `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, and the public quote/booking endpoints; standard limits elsewhere. `helmet` for baseline security headers (CSP, HSTS, X-Content-Type-Options, etc.), tuned to allow the SPA's own asset origins.

**Rationale**: Explicit user requirement ("Rate limiting and security headers"), scoped per constitution's explicit requirement ("Rate limiting for public quote, booking, and feedback endpoints").

---

## Summary: NEEDS CLARIFICATION Status

All Technical Context fields are resolved — no `NEEDS CLARIFICATION` markers remain. The only open items are the two documented, mitigated constitution deviations in R9, which are non-blocking per constitution governance (deviations are permitted when justified in Complexity Tracking).
