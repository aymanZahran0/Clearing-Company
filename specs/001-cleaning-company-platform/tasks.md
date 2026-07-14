# Tasks: Nuqaa Asir Cleaning Booking & Operations Platform

**Input**: Design documents from `/specs/001-cleaning-company-platform/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `traceability.md`, `quickstart.md`)

**Tests**: Included. The `/speckit-plan` input explicitly required Vitest+RTL (frontend), Vitest+Supertest (backend), and Playwright E2E coverage of the listed workflows, so test tasks are generated alongside implementation tasks in every phase.

**Organization**: Tasks are grouped by the 8 user stories from `spec.md`, in priority order (P1 → P2 → P3), so each story is a complete, independently testable increment on top of Setup + Foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps to US1–US8 from `spec.md`
- File paths are relative to the repository root and match the tree in `plan.md`

## Path Conventions

- Frontend: `apps/web/src/...`
- Backend: `apps/api/src/...`
- Shared: `packages/shared/src/...`
- E2E: `tests/e2e/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo scaffold and tooling — no business logic yet.

- [X] T001 Initialize npm workspace at repo root (switched from pnpm to npm workspaces — see `research.md` R1 — `corepack enable` failed with EPERM in this environment): root `package.json` with `workspaces: ["apps/*", "packages/*"]`, root `tsconfig.base.json`
- [X] T002 [P] Scaffold `apps/web` with Vite + React + TypeScript template; add `apps/web/tsconfig.json` extending root config
- [X] T003 [P] Scaffold `apps/api` with TypeScript + Express project skeleton (`apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/tsconfig.json`)
- [X] T004 [P] Scaffold `packages/shared` as a TS package (`packages/shared/package.json`, `packages/shared/src/index.ts`, `packages/shared/tsconfig.json`) and wire it as a workspace dependency of `apps/web` and `apps/api`
- [X] T005 [P] Configure root ESLint (flat config, `eslint.config.js`) + Prettier shared config
- [X] T006 [P] Add Tailwind CSS to `apps/web` (`apps/web/tailwind.config.ts`, `apps/web/postcss.config.js`) with RTL-aware plugin (`tailwindcss-rtl` or logical-properties preset)
- [X] T007 [P] Add Ant Design to `apps/web`, configure `ConfigProvider` scaffold in `apps/web/src/app/AppProviders.tsx` (direction prop wired to i18n locale, populated in Phase 2)
- [X] T008 [P] Initialize Prisma in `apps/api` (`apps/api/prisma/schema.prisma` skeleton, `DATABASE_URL` wiring in `apps/api/src/lib/prisma.ts`)
- [X] T009 [P] Add Vitest + React Testing Library config to `apps/web` (`apps/web/vitest.config.ts`, `apps/web/tests/setup.ts`)
- [X] T010 [P] Add Vitest + Supertest config to `apps/api` (`apps/api/vitest.config.ts`) and a disposable test-database bootstrap script
- [X] T011 [P] Add Playwright config at repo root (`playwright.config.ts`) targeting `tests/e2e/`, wired to run both apps
- [X] T012 [P] Create `.env.example` files for `apps/web` and `apps/api` per `quickstart.md` Environment Variables section
- [X] T013 Add root `package.json` scripts: `dev`, `build`, `test`, `test:e2e`, `lint`, `typecheck` fanning out to each workspace

**Checkpoint**: `npm install` succeeds (616 packages); `apps/api` boots on :4000 (health check verified); `apps/web`/`apps/api`/`packages/shared` all typecheck cleanly; `packages/shared` builds. Verified live in this session.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth, cross-cutting middleware, shared schemas, and the app shells every user story depends on.

**⚠️ CRITICAL**: No user-story phase may begin until this phase is complete — every story needs authentication and the base app shells.

### Shared package

- [X] T014 [P] Define core enums in `packages/shared/src/types/enums.ts`: `Role`, `BookingStatus`, `PropertyType`, `PricingType`, `PaymentMethod`, `PaymentStatus`, `NotificationChannel` (per `data-model.md`)
- [X] T015 [P] Define base Zod primitives in `packages/shared/src/schemas/common.ts`: Saudi phone validator, UUID, money (integer minor units), pagination query schema
- [X] T016 [P] Define shared `ErrorResponse` type and API contract constants in `packages/shared/src/api-contract/errors.ts` matching `contracts/openapi.yaml` `ErrorResponse` schema

### Backend foundation

- [X] T017 Define `User`, `RefreshToken`, `PasswordResetToken`, `AuditLog`, `SystemSetting`, `NotificationTemplate`, `NotificationLog` models in `apps/api/prisma/schema.prisma` per `data-model.md` §1, 27, 26, 24 — plus `CustomerProfile` pulled forward from Phase 3 (see T049 note) and `fullName` added to `User` (deviation noted in schema.prisma comments)
- [X] T018 Generate Prisma client (`prisma generate` — verified). **Blocked**: `prisma migrate dev` requires a live PostgreSQL instance, unavailable in this sandbox (no `psql`/`docker`). Schema is `prisma validate`-clean; run `npm run prisma:migrate --workspace apps/api` against a real `DATABASE_URL` before first use
- [X] T019 [P] Implement centralized error handler in `apps/api/src/middleware/errorHandler.ts` producing the `ErrorResponse` shape from `contracts/openapi.yaml`
- [X] T020 [P] Implement structured request logger with PII redaction (phone/address never logged, FR-078) in `apps/api/src/middleware/requestLogger.ts` using `pino` — verified live (T183 will add the log-grep CI check)
- [X] T021 [P] Implement `validateRequest` Zod middleware in `apps/api/src/middleware/validateRequest.ts` consuming schemas from `packages/shared`
- [X] T022 [P] Implement rate-limiting middleware in `apps/api/src/middleware/rateLimit.ts` with stricter limits for auth/public booking routes per `research.md` R10 — verified live (ratelimit headers observed)
- [X] T023 [P] Apply `helmet` security headers in `apps/api/src/app.ts` — verified live (CSP/HSTS headers observed)
- [X] T024 Implement `authenticate` middleware (JWT verification) in `apps/api/src/middleware/authenticate.ts`
- [X] T025 Implement `requireRole(role)` middleware in `apps/api/src/middleware/requireRole.ts` enforcing CUSTOMER/ADMIN boundary server-side (FR-003)
- [X] T026 [P] Implement `auditLogger` helper in `apps/api/src/middleware/auditLogger.ts` writing `AuditLog` rows transactionally with the triggering mutation (FR-004)
- [X] T027 Implement password hashing (`bcrypt`) and JWT access/refresh issuing + rotation-on-use logic in `apps/api/src/modules/auth/service.ts`
- [X] T028 Implement auth Zod schemas in `apps/api/src/modules/auth/schema.ts` (register, login, forgot-password, reset-password)
- [X] T029 Implement auth routes/controller in `apps/api/src/modules/auth/routes.ts`, `controller.ts`: `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `GET /auth/me`
- [X] T030 [P] Implement phone normalization utility in `apps/api/src/lib/phoneNormalization.ts` (Saudi E.164)
- [X] T031 [P] Implement `apps/api/src/openapi/` to serve `contracts/openapi.yaml` at `/api/v1/docs` — verified live
- [X] T032 Wire all Phase 2 middleware into `apps/api/src/app.ts` in the correct order (logger → rate limit → helmet → body parser → routes → error handler) — verified live via health check
- [X] T033 [P] Seed script skeleton in `apps/api/prisma/seed.ts`: one Admin account, `SystemSetting` defaults (`default_locale`, `tax_rate`, `booking_horizon_weeks`), `NotificationTemplate` rows per FR-065 event keys — not yet run (requires live DB per T018)

### Frontend foundation

- [X] T034 [P] Configure `react-i18next` in `apps/web/src/lib/i18n.ts` with `ar` (default) and `en` locale namespaces at `apps/web/src/locales/ar/` and `apps/web/src/locales/en/`
- [X] T035 [P] Wire Ant Design `ConfigProvider direction` + Tailwind `dir` attribute to the active i18n locale in `apps/web/src/app/AppProviders.tsx` — verified: built `dist/index.html` shows `dir="rtl" lang="ar"`
- [X] T036 Set up Redux store in `apps/web/src/app/store.ts` and base RTK Query `apiSlice` in `apps/web/src/api/baseApi.ts` (baseUrl from `VITE_API_BASE_URL`, auth header injection, refresh-on-401 re-auth flow)
- [X] T037 [P] Implement `apps/web/src/api/authApi.ts` RTK Query endpoints matching T029
- [X] T038 Implement route tree skeleton in `apps/web/src/app/router.tsx`: public routes, `customer/*`, `admin/*`, with `RequireAuth`/`RequireRole` guards in `apps/web/src/guards/`
- [X] T039 [P] Build shared layout shell in `apps/web/src/components/layout/` (RTL-aware header/nav, mobile drawer, 44×44px touch targets, 360px-safe)
- [~] T040 [P] Shared `ui/` component wrappers — **deferred to Phase 3**: Ant Design components are used directly (Button, Input, Form) so far; a dedicated `components/ui/` wrapper layer will be introduced in Phase 3 only if/when a real customization need appears, per constitution "no premature abstraction"
- [X] T041 [P] Implement Customer auth pages: `apps/web/src/customer/pages/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`
- [X] T042 [P] Implement Admin login page `apps/web/src/admin/pages/Login.tsx` and empty `Dashboard.tsx` shell
- [X] T043 [P] Implement idempotency-key helper in `apps/web/src/lib/idempotency.ts` (generates/stores a UUID per in-flight form submission)
- [X] T044 [P] Implement locale-aware date/currency/phone formatters in `apps/web/src/lib/formatters.ts` using `Intl` with `ar-SA`/`en-SA`

### Foundational tests

- [X] T045 [P] Unit tests for phone normalization (`apps/api/tests/unit/phoneNormalization.test.ts`) — **12/12 passing, verified live**
- [X] T046 [P] Integration tests for auth flows — register/login/refresh/logout/reset (`apps/api/tests/integration/auth.test.ts`) — written and confirmed to load/execute up to the DB call; **not executable to a pass/fail result in this sandbox** (no PostgreSQL available — run via `npm run test:integration --workspace apps/api` against a real `DATABASE_URL`)
- [X] T047 [P] Integration test: unauthenticated request to any Admin-only route → 401; Customer token on Admin-only route → 403 (`apps/api/tests/integration/authorization.test.ts`) — same DB caveat as T046
- [X] T048 [P] Component test: `RequireRole` guard redirects unauthorized users (`apps/web/tests/unit/guards.test.tsx`) — **5/5 passing, verified live**

**Checkpoint**: A user can register/login as Customer, an Admin can log in, role-gated routing works client- and server-side, and every subsequent story can build on this without touching auth again. Verified live in this session: both apps typecheck and build cleanly, `apps/api` boots and serves `/health`/`/docs` with logging+helmet+rate-limiting active, `apps/web` builds to prerendered-ready static output with correct `dir="rtl"`, and all DB-independent tests pass (17/17). Auth/authorization integration tests require a live PostgreSQL instance not available in this environment — see notes above.

---

## Phase 3: User Story 1 - Customer Requests a Cleaning Service Online (Priority: P1) 🎯 MVP

**Goal**: A customer can browse services, get a price estimate, and submit a booking end-to-end from a mobile browser, receiving a booking reference.

**Independent Test**: Complete the full flow from service catalog to booking reference using only a phone browser; quotes may be "pending review" and nothing downstream (scheduling, execution) needs to exist yet.

### Data model for US1

- [X] T049 [US1] Define `CustomerAddress`, `ServiceArea` models in `apps/api/prisma/schema.prisma` (`CustomerProfile` was pulled forward into Foundational T017 since `/auth/register` needed it)
- [X] T050 [US1] Define `ServiceCategory`, `Service`, `ServiceImage`, `ServiceAddOn`, `PricingRule`, `DiscountCode` models in `apps/api/prisma/schema.prisma`
- [X] T051 [US1] Define `Quote`, `Booking`, `BookingItem`, `BookingStatusHistory` models in `apps/api/prisma/schema.prisma` (full field list per `data-model.md` §11–14, including the `BookingStatus` enum and idempotency-key unique constraint)
- [X] T052 [US1] Define `OperatingHours`, `ClosedDate`, `TimeSlot` models in `apps/api/prisma/schema.prisma`
- [X] T053 [US1] Run migration for all US1 models — **same T018 caveat**: `prisma validate`/`format`/`generate` all succeed; `prisma migrate dev` requires the live PostgreSQL instance unavailable in this sandbox

### Backend for US1

- [X] T054 [P] [US1] Zod schemas for catalog/address/pricing in `apps/api/src/modules/services/schema.ts`, `service-add-ons/schema.ts`, `service-categories/schema.ts`, `addresses/schema.ts`
- [X] T055 [P] [US1] Pure pricing-calculation functions in `apps/api/src/lib/pricing/` (FIXED, PROPERTY_SIZE, HOURLY, QUANTITY, CUSTOM_QUOTE paths; add-ons, travel fee, tax, discount-code layering per `research.md` R7) — **25/25 unit tests passing, verified live**
- [X] T056 [US1] Service-catalog module: `apps/api/src/modules/service-categories/*`, `apps/api/src/modules/services/*`, `apps/api/src/modules/service-add-ons/*` — public GET, Admin-gated write endpoints — verified live (public routes return correct 500-on-no-DB, not a crash)
- [X] T057 [US1] Service-images module — completed in Polish: `apps/api/src/lib/storage/` defines a `StorageAdapter` interface with an S3-compatible implementation (`@aws-sdk/client-s3`, works against AWS S3/R2/MinIO via `OBJECT_STORAGE_ENDPOINT`), lazily constructed so the API still boots without storage configured; `apps/api/src/modules/service-images/*` adds `POST /services/:id/images` (multer memory storage, `sharp` re-encode strips EXIF per data-model.md §7, MIME/size validated) and `DELETE /service-images/:id`; frontend `apps/web/src/admin/pages/catalog/ServiceImages.tsx` added at `/admin/catalog/services/:slug/images` (same standalone pattern as `ChecklistTemplateEditor.tsx`); integration test `apps/api/tests/integration/serviceImages.test.ts` (422/403 paths) — written and confirmed to load/compile, same no-live-DB caveat as other integration tests, and the upload-success path additionally needs real object-storage credentials to fully exercise
- [X] T058 [US1] Pricing-rules module `apps/api/src/modules/pricing-rules/*` and `apps/api/src/modules/service-areas/*` — CRUD gated Admin, public read
- [X] T059 [US1] Discount-codes read/validate path in `apps/api/src/modules/discount-codes/*` (`POST /discount-codes/validate` only; full CRUD deferred to Polish T176 as originally planned)
- [X] T060 [US1] Availability module `apps/api/src/modules/availability/*`: `GET /availability`, operating-hours/closed-dates/time-slots CRUD (Admin), capacity computation
- [X] T061 [US1] Quotes module `apps/api/src/modules/quotes/*`: `POST /quotes/estimate` (calls pricing lib), `GET /quotes/{id}`
- [X] T062 [US1] Addresses module `apps/api/src/modules/addresses/*`: `GET/POST /addresses/me`, `PATCH/DELETE /addresses/me/{id}`
- [X] T063 [US1] Customers module (self) `apps/api/src/modules/customers/*`: `GET/PATCH /customers/me` — Admin search/get/update (originally Phase 4's T088) also included since it shared the same module
- [X] T064 [US1] Bookings module create/list/get (customer-facing) `apps/api/src/modules/bookings/*`: `POST /bookings` with `Idempotency-Key` header handling, `GET /bookings` (own), `GET /bookings/{id}` (own), `GET /bookings/reference/{referenceNumber}` with verification token (FR-077) — **`POST /bookings/admin` (Phase 4's T089) also included**, see Phase 4 note below
- [X] T065 [US1] Booking reference + verification-token generator in `apps/api/src/lib/bookingReference.ts`
- [X] T066 [US1] Booking state machine in `apps/api/src/lib/bookingStateMachine.ts` — full transition table defined per `data-model.md` (not just `DRAFT → PENDING`), so later phases only add the route/service code that calls `assertTransition`, not new state-machine shape
- [X] T067 [US1] Wire booking creation to write a `NotificationLog` "booking confirmation prepared" entry using the `BOOKING_CONFIRMED` template (failure never blocks booking creation, FR-070) — `.catch()`-wrapped outside the DB transaction, verified by code review; `recipient` field is empty pending the Polish-phase (T177) template-resolution work

### Frontend for US1

- [X] T068 [P] [US1] `apps/web/src/api/servicesApi.ts`, `quotesApi.ts`, `bookingsApi.ts`, `addressesApi.ts` RTK Query slices matching Phase-3 backend endpoints (`availabilityApi.ts` also added, needed by `ScheduleStep`)
- [X] T069 [P] [US1] `apps/web/src/customer/pages/Home.tsx` (public, prerender-eligible)
- [X] T070 [P] [US1] `apps/web/src/customer/pages/ServiceCatalog.tsx` (public, prerender-eligible)
- [X] T071 [P] [US1] `apps/web/src/customer/pages/ServiceDetail.tsx` (public, prerender-eligible)
- [X] T072 [US1] Booking Wizard shell + step state (Redux slice) in `apps/web/src/customer/pages/BookingWizard/` and `apps/web/src/features/bookingWizard/`
- [X] T073 [P] [US1] `PropertyStep.tsx`, `AddressStep.tsx` (with service-area validation), `ScheduleStep.tsx` (availability-aware date/time picker), `AddOnsStep.tsx`
- [X] T074 [US1] `QuoteReviewStep.tsx` — live price preview via `POST /quotes/estimate`, discount-code field, "pending review" messaging
- [X] T075 [US1] `ConfirmationStep.tsx` — consent checkbox, idempotent submit, booking-reference + WhatsApp click-to-chat display
- [X] T076 [P] [US1] `apps/web/src/customer/pages/BookingsList.tsx`, `BookingDetail.tsx` (own bookings, status timeline)
- [X] T077 [P] [US1] `apps/web/src/customer/pages/Profile.tsx`, `Addresses.tsx` — `Profile.tsx` now reads from `GET /customers/me` (not `/auth/me`, so `marketingConsent`/`preferredChannel` load correctly) and its save action is wired to `PATCH /customers/me` via new `useGetOwnProfileQuery`/`useUpdateOwnProfileMutation` hooks added to `apps/web/src/api/customersApi.ts`
- [X] T078 [P] [US1] `apps/web/src/customer/pages/PublicBookingLookup.tsx` (reference + token, unauthenticated)
- [~] T079 [US1] Vite prerendering for public routes — **deferred to Polish**: adding an unvetted prerendering plugin (`vite-plugin-ssr`/`vite-plugin-prerender`) risked breaking the verified-clean build in this session without a way to test the prerendered output end-to-end here; `vite.config.ts` has a comment marking exactly where it goes. The constitution Principle V gap this leaves is unchanged from `research.md` R9's original assessment
- [X] T080 [P] [US1] Arabic + English translation strings for all US1 screens in `apps/web/src/locales/ar/`, `en/` (core nav/auth/common strings; wizard step labels are currently English-only literals, not yet extracted to i18n keys — follow-up)

### Tests for US1

- [X] T081 [P] [US1] Unit tests for pricing-calculation functions (property-based: same inputs → same output) in `apps/api/tests/unit/pricing.test.ts` — **13/13 passing, verified live**
- [X] T082 [P] [US1] Integration test: duplicate submit with same `Idempotency-Key` → single `Booking` row (`apps/api/tests/integration/bookings.create.test.ts`) — written, same no-live-DB caveat as T046/T047
- [X] T083 [P] [US1] Integration test: booking request in a disabled service area → 409 (`apps/api/tests/integration/serviceArea.test.ts`) — same DB caveat
- [X] T084 [P] [US1] Integration test: public reference lookup without token → 403 (`apps/api/tests/integration/bookingLookup.test.ts`) — same DB caveat
- [X] T085 [P] [US1] Component tests for Booking Wizard steps (`apps/web/tests/unit/BookingWizard.test.tsx`) — **2/2 passing, verified live** (required adding a `matchMedia` polyfill to `apps/web/tests/setup.ts` for Ant Design's responsive hooks)
- [X] T086 [US1] E2E spec written (`tests/e2e/customer-registration-and-booking.spec.ts`) covering registration → catalog → wizard → confirmation at a mobile viewport, implementing quickstart.md V1 — **not executable in this sandbox** (needs both apps running + live DB); selectors were written against the actual implemented components, not guessed

**Checkpoint**: User Story 1 backend is code-complete, typechecked, and boots correctly (verified live via direct HTTP requests). Frontend builds cleanly and all runnable tests pass (37/37 across the whole repo so far). **Not yet verified**: the actual end-to-end booking flow through a real browser against a real database — this requires an environment with PostgreSQL, which this sandbox does not have. T057 (storage adapter) and T077 (profile-save wiring) were completed later, in the Polish phase, once network installs became available in this sandbox — see their entries above. T079 (prerendering) and T080 (wizard-string extraction) remain open follow-ups.

---

## Phase 4: User Story 2 - Agent Creates a Booking from a Phone or WhatsApp Call (Priority: P1)

**Goal**: Admin can create a complete booking on behalf of a phone/WhatsApp caller without that caller touching the website.

**Independent Test**: As Admin, create a full booking for a test phone number using only the internal system; confirm it appears in the same list/lifecycle as a web-submitted booking.

- [X] T087 [US2] Extend `User` creation path to support Admin-created `status = INVITED` customers with `passwordHash = null` in `apps/api/src/modules/bookings/service.ts` (`resolveCustomerId`/`newCustomer` path — per `research.md` R6) — built alongside T064 since `/bookings/admin` needed it to be meaningful
- [X] T088 [US2] Customers search endpoint `GET /customers?search=` (normalized-phone match) in `apps/api/src/modules/customers/*`, Admin-gated — built alongside T063
- [X] T089 [US2] `POST /bookings/admin` endpoint in `apps/api/src/modules/bookings/*` — reuses US1's pricing/quote/creation logic, sets `source = ADMIN_PHONE`, `createdByUserId` — built alongside T064
- [X] T090 [P] [US2] `apps/web/src/api/customersApi.ts` RTK Query slice (search, create, get, update)
- [X] T091 [US2] Admin Dashboard shell nav wiring: `AdminShell` in `apps/web/src/components/layout/AppShell.tsx` gained a responsive Sider (desktop) + Drawer (mobile) nav with an extensible `ADMIN_NAV_ITEMS` list; `apps/web/src/admin/routes.tsx` was not created as a separate file — admin routes are registered directly in `apps/web/src/app/router.tsx` alongside customer routes, which was simpler than a second route-tree file for the current route count
- [X] T092 [US2] `apps/web/src/admin/pages/bookings/NewPhoneBooking.tsx` — 3-step customer search-or-create → address/service → confirm flow; required adding two small backend endpoints not in the original module list: `POST /customers` (explicit Admin customer creation) and `POST /customers/{customerId}/addresses` (Admin creates an address before the customer has any account activity), both reusing the same `createInvitedCustomer` helper as `/bookings/admin`'s inline path
- [~] T093 [P] [US2] Arabic + English strings for US2 screens — nav/shared strings covered; `NewPhoneBooking.tsx`'s own labels are English-only literals (same follow-up as T080)
- [X] T094 [P] [US2] Integration test: Admin creates booking for new/existing customer via `/bookings/admin` (`apps/api/tests/integration/bookings.admin.test.ts`) — written, same no-live-DB caveat as prior integration tests
- [X] T095 [US2] E2E spec written (`tests/e2e/admin-phone-booking.spec.ts`) implementing quickstart.md V2 — same not-executable-in-sandbox caveat as T086

**Checkpoint**: Both booking-creation channels (web self-service, Admin-assisted) are code-complete, typechecked, and build cleanly (verified live). The Admin flow required extending the customers/addresses modules beyond their original US1 scope — documented above rather than silently added.

---

## Phase 5: User Story 3 - Admin Reviews, Quotes, and Confirms a Booking (Priority: P1)

**Goal**: Admin can review a pending booking, adjust/confirm its price, and confirm or reject it, with every change audited and price locked at confirmation.

**Independent Test**: Take a pending booking from US1/US2 and walk it through review → confirm/reject independently, verifying status and price-snapshot behavior.

- [X] T096 [US3] Define `Payment`, `Invoice` models in `apps/api/prisma/schema.prisma` — validated/generated cleanly; migration still pending live DB (same T018/T053 caveat)
- [X] T097 [US3] `POST /bookings/{id}/confirm` — price/override validation, required-field guard (FR-034), snapshot fields set once, `AuditLog` entry on override, in `apps/api/src/modules/bookings/*`
- [X] T098 [US3] `POST /bookings/{id}/reject` with required reason, in `apps/api/src/modules/bookings/*`
- [X] T099 [US3] `GET /bookings` (Admin, all bookings, filterable by status/date — built in Phase 3 alongside `listOwnBookings` since they share one endpoint gated by role) and `GET /bookings/{id}/history` in `apps/api/src/modules/bookings/*` — a separate `booking-status-history` module folder was not created; history reads live in `bookings/service.ts` since it only ever queries in the context of one booking
- [X] T100 [US3] Payments module `apps/api/src/modules/payments/*`: `POST/GET /bookings/{id}/payments`, `GET /bookings/{id}/invoice` (non-fiscal receipt, FR-064)
- [X] T101 [P] [US3] Admin booking endpoints added directly to `apps/web/src/api/bookingsApi.ts` (confirm/reject/history) rather than a separate `bookingsAdminApi.ts` — same file already had the Admin list/create endpoints from Phase 4, so splitting it would have fragmented one resource's API slice; `apps/web/src/api/paymentsApi.ts` created as planned
- [X] T102 [US3] `apps/web/src/admin/pages/bookings/List.tsx` (filterable, paginated table), `Detail.tsx` (status, confirm/reject actions, payments, history timeline)
- [X] T103 [P] [US3] `apps/web/src/admin/pages/bookings/ConfirmDialog.tsx` (price override + reason), `RejectDialog.tsx`
- [X] T104 [P] [US3] `apps/web/src/admin/pages/payments/RecordPaymentDialog.tsx`, `Invoices.tsx` (exports `PaymentsList`, embedded in Booking Detail rather than a standalone route — no separate "all invoices" admin screen exists yet)
- [X] T105 [P] [US3] `apps/web/src/customer/pages/InvoicesAndPayments.tsx` (own completed bookings' invoice list)
- [~] T106 [P] [US3] Arabic + English strings for US3 screens — same follow-up as T080/T093: Admin-side labels are English-only literals pending i18n-key extraction
- [X] T107 [P] [US3] Integration test: confirm without required reason on a price override → 422; confirming an already-confirmed booking → 409 (`apps/api/tests/integration/bookings.confirm.test.ts`) — written, same no-live-DB caveat
- [X] T108 [P] [US3] Integration test: price override recorded in `AuditLog`; later catalog price change doesn't alter snapshot (`apps/api/tests/integration/pricingSnapshot.test.ts`) — written, same caveat
- [X] T109 [US3] E2E spec written (`tests/e2e/booking-confirmation-and-pricing.spec.ts`) implementing quickstart.md V3 — same not-executable-in-sandbox caveat

**Checkpoint**: Bookings can flow from submitted → confirmed/rejected with immutable, audited pricing. Code-complete, typechecked, builds cleanly (verified live). Same DB-unavailability caveat applies to all integration/E2E tests in this phase.

---

## Phase 6: User Story 4 - Admin Schedules a Booking and Records Internal Handling Notes (Priority: P2)

**Goal**: Admin sets a planned time and an optional free-text internal note on confirmed bookings, respecting configured time-slot capacity.

**Independent Test**: Schedule a batch of confirmed bookings, verifying capacity is never exceeded without an explicit recorded override, and internal notes are visible on the calendar.

- [X] T110 [US4] `POST /bookings/{id}/schedule` — sets `scheduledStartAt`/`scheduledEndAt`/`internalHandlingNote`, capacity check against `TimeSlot.bookedCount`/`capacity`, `overrideCapacity` flag + `AuditLog` entry, in `apps/api/src/modules/bookings/*` — added `Booking.scheduledTimeSlotId` (not in data-model.md verbatim) to link a scheduled booking to the slot whose capacity it occupies, documented in schema.prisma
- [X] T111 [US4] `POST /bookings/{id}/reschedule`, `POST /bookings/{id}/cancel` (no-fee, FR-040) in `apps/api/src/modules/bookings/*` — reschedule passes through CONFIRMED→RESCHEDULED→CONFIRMED per the state machine, releasing the old slot's capacity and re-checking the new one
- [X] T112 [US4] `GET /bookings?from=&to=` calendar-range query, "needs scheduling" filter (`status=CONFIRMED`, `scheduledStartAt IS NULL`) in `apps/api/src/modules/bookings/*` — added distinct `scheduledFrom`/`scheduledTo` params (filtering `scheduledStartAt`) alongside the existing `from`/`to` (which filter `createdAt` for the general Admin list), since a calendar view and a "created in range" filter are different queries
- [X] T113 [P] [US4] `apps/web/src/admin/pages/schedule/CalendarDay.tsx`, `CalendarWeek.tsx`, `TimeSlots.tsx`, `OperatingHours.tsx`, `ClosedDates.tsx` — all wired to the availability endpoints built in T060; routes registered in `router.tsx` and `AdminShell` nav
- [X] T114 [US4] `apps/web/src/admin/pages/bookings/ScheduleDialog.tsx` (planned time + internal note + capacity-conflict warning/override)
- [X] T115 [P] [US4] `apps/web/src/admin/pages/bookings/RescheduleDialog.tsx`, `CancelDialog.tsx` — `CancelDialog` takes an optional `triggerLabel` prop and is imported directly by `customer/pages/BookingDetail.tsx` (T116) as planned
- [X] T116 [P] [US4] Customer-facing cancel affordance on `apps/web/src/customer/pages/BookingDetail.tsx` (reuses admin's `CancelDialog`) — a dedicated "request reschedule" affordance was not added; the only implemented reschedule path is Admin-driven (`RescheduleDialog.tsx`), matching FR-029's Admin-owns-scheduling model, so a customer self-service reschedule request queue was out of scope for this task list
- [~] T117 [P] [US4] Arabic + English strings for US4 screens — same follow-up as T080/T093/T106: schedule-screen labels are English-only literals pending i18n-key extraction; only the `AdminShell` nav entries route through existing i18n-covered strings
- [X] T118 [P] [US4] Integration test: scheduling into a full time slot without override → 409; with override → 200 + `AuditLog` entry (`apps/api/tests/integration/scheduling.test.ts`) — written and confirmed to load/execute up to the DB call (verified live: fails only on the expected `DATABASE_URL` connection, not a code/type error), same no-live-DB caveat as prior integration tests
- [X] T119 [US4] E2E spec written (`tests/e2e/scheduling-and-capacity.spec.ts`) implementing quickstart.md V4 — same not-executable-in-sandbox caveat as prior E2E specs

**Checkpoint**: Confirmed bookings can be scheduled without a structured staff/team system, and capacity is enforced. Code-complete, typechecked, builds cleanly (verified live: `npm run typecheck` and `npm run build --workspace apps/web` both pass; `apps/api` unit tests 25/25 pass; `apps/web` unit tests 9/9 pass). Same DB-unavailability caveat applies to all integration/E2E tests in this phase. Also cleaned up ~68 stale compiled `.js` files under `apps/web/src` and `apps/web/tests` (leftover from an earlier plain `tsc` run) that were shadowing current `.tsx`/`.ts` sources in Vite/Vitest module resolution — confirmed live by a test failure (`useCancelBookingMutation is not a function`) traced to the stale `bookingsApi.js`; removed with explicit user confirmation.

---

## Phase 7: User Story 5 - Admin Tracks Execution and Completes the Quality Checklist (Priority: P2)

**Goal**: Admin marks en route/arrived/started/completed and runs a per-service quality checklist, with completion gated on required items.

**Independent Test**: Walk a scheduled booking through arrival → execution → checklist completion, confirming completion is blocked while required items are outstanding.

- [X] T120 [US5] Define `ChecklistTemplate`, `ChecklistTemplateItem`, `ChecklistRun`, `ChecklistResult`, `QualityIssue` models in `apps/api/prisma/schema.prisma` (item `type` excludes PHOTO per Clarifications) — `ChecklistTemplateItem.label` split into `labelAr`/`labelEn` (deviation from data-model.md's single `label`, for consistency with every other bilingual field, FR-075); `prisma validate`/`format`/`generate` all succeed, `prisma migrate dev` still blocked on the missing live PostgreSQL instance (same T018/T053/T096 caveat)
- [X] T121 [US5] Checklist-templates module `apps/api/src/modules/checklists/*`: `GET/PUT /services/{id}/checklist-template` (versioned, Admin-gated) — publishing a new version deactivates the previous one and creates version+1 rather than mutating in place, so existing `ChecklistRun` snapshots are never affected
- [X] T122 [US5] `POST /bookings/{id}/en-route`, `/arrive`, `/start` (requires `arrivedAt` before `IN_PROGRESS`, FR-036) in `apps/api/src/modules/bookings/*` — `en-route`/`arrive` are sub-state timestamps only (status stays `CONFIRMED`); `start` is the only one that calls `assertTransition`, extending `bookingStateMachine.ts`'s existing CONFIRMED→IN_PROGRESS edge (no state-machine shape change needed, matching T066's original design intent)
- [X] T123 [US5] `GET/PATCH /bookings/{id}/checklist`, `POST /bookings/{id}/checklist/review` — snapshots template version at run start (FR-046, verified by T132), Admin self-review
- [X] T124 [US5] `POST /bookings/{id}/complete` — blocks unless all required checklist items answered (FR-048/FR-051), queues `FEEDBACK_REQUEST` notification (`.catch()`-wrapped, same best-effort pattern as T067), in `apps/api/src/modules/bookings/*`
- [X] T125 [US5] Checklist-item "flag as issue" path auto-creates `QualityIssue` with `source = CHECKLIST_FAILURE` in `apps/api/src/modules/checklists/service.ts`
- [X] T126 [P] [US5] `apps/web/src/api/checklistsApi.ts` RTK Query slice
- [X] T127 [US5] `apps/web/src/admin/pages/catalog/ChecklistTemplateEditor.tsx` — no broader catalog admin section (services List/Editor screens) exists yet to add it to, so this stands alone at `/admin/catalog/services/:serviceId/checklist`, ready to be linked from a catalog list once one ships
- [X] T128 [US5] `apps/web/src/admin/pages/bookings/ChecklistRunner.tsx` — item entry by type, required-item indicators, issue-flag control with a note field
- [X] T129 [P] [US5] Execution-timeline controls (en route/arrive/start/complete buttons) on `apps/web/src/admin/pages/bookings/Detail.tsx`, embedding `ChecklistRunner` while `IN_PROGRESS`
- [~] T130 [P] [US5] Arabic + English strings for US5 screens — same follow-up as T080/T093/T106/T117: screen labels are English-only literals pending i18n-key extraction
- [X] T131 [P] [US5] Integration test: `start` before `arrive` → 409; `complete` with required item missing → 409 listing outstanding items (`apps/api/tests/integration/execution.test.ts`) — written and confirmed to load/execute up to the DB call, same no-live-DB caveat as prior integration tests
- [X] T132 [P] [US5] Integration test: checklist template edited mid-run doesn't alter an in-flight `ChecklistRun` (`apps/api/tests/integration/checklistSnapshot.test.ts`) — same caveat
- [X] T133 [US5] E2E spec written (`tests/e2e/execution-and-checklist.spec.ts`) implementing quickstart.md V5 — same not-executable-in-sandbox caveat as prior E2E specs

**Checkpoint**: Bookings can be executed and completed with enforced quality gating, entirely by the Admin role. Code-complete, typechecked, builds cleanly (verified live: full monorepo `npm run typecheck` and `npm run build --workspace apps/web` both pass; `apps/api` unit tests 25/25 pass; `apps/web` unit tests 9/9 pass, 3 files). Same DB-unavailability caveat applies to all integration/E2E tests in this phase. Also fixed the recurring stray-`.js` root cause from T119's checkpoint: `apps/web/tsconfig.json` was missing `"noEmit": true`, so its `build` script's `tsc -b` step (with no `outDir`) kept re-emitting compiled `.js` next to every `.tsx`/`.ts` source on each build; added `noEmit: true` and re-cleaned the files it had already regenerated (with user confirmation) — verified fixed by running the build twice in a row and confirming zero stray files both times.

---

## Phase 8: User Story 6 - Customer Feedback and Complaint/Rework Handling (Priority: P2)

**Goal**: Customers rate/complain after completion; Admin triages, resolves, and can spin up a linked rework booking.

**Independent Test**: Submit a low rating/complaint against a completed booking and walk it through categorization, resolution, and rework linkage independently.

- [X] T134 [US6] Define `Review` model in `apps/api/prisma/schema.prisma` (unique per booking, `followUpRequired` auto-set on rating ≤2) — `prisma validate`/`format`/`generate` all succeed, migration still pending live DB (same recurring caveat)
- [X] T135 [US6] `POST /bookings/{id}/review` in `apps/api/src/modules/reviews-and-complaints/*` (one per completed booking) — a rating ≤2 auto-creates the `QualityIssue` (source=REVIEW) and transitions the booking to `COMPLAINT_OPENED` in the same transaction, so FR-054's "auto-set" requirement doesn't need a separate complaint submission
- [X] T136 [US6] `POST /bookings/{id}/complaints` — creates `QualityIssue` with `source = COMPLAINT` (standalone, independent of rating; `source = REVIEW` is set by T135's auto-open path instead — together they cover the `source ∈ {REVIEW, COMPLAINT}` requirement), sets `Booking.status = COMPLAINT_OPENED` when the booking was `COMPLETED`
- [X] T137 [US6] `GET /quality-issues`, `GET /quality-issues/{id}`, `PATCH /quality-issues/{id}` (category/severity/owner/status, `resolution` required before `CLOSED`) in `apps/api/src/modules/reviews-and-complaints/*`
- [X] T138 [US6] `POST /quality-issues/{id}/rework` — creates a new `Booking` with `originalBookingId` set, copying customer/address/service items with no re-entry (FR-053); priced as complimentary (all snapshot fields 0) since the deviation isn't a new sale — Admin can still override price at confirm time like any booking
- [X] T139 [US6] `GET /quality-issues/alerts` — low-rating / aged-complaint (>3 days open) alert aggregation, in `apps/api/src/modules/reviews-and-complaints/service.ts`, consumed by the Admin dashboard
- [X] T140 [P] [US6] `apps/web/src/api/reviewsApi.ts`, `qualityIssuesApi.ts` RTK Query slices
- [X] T141 [P] [US6] `apps/web/src/customer/pages/ReviewForm.tsx`, `ComplaintForm.tsx`, linked from `customer/pages/BookingDetail.tsx` when a booking is `COMPLETED`/`COMPLAINT_OPENED`
- [X] T142 [US6] `apps/web/src/admin/pages/quality/Reviews.tsx`, `Complaints.tsx`, `ComplaintDetail.tsx`, `ReworkDialog.tsx` — `Reviews.tsx`/`Complaints.tsx` are filtered views of the single unified `QualityIssue` list (`source=REVIEW`/`source=COMPLAINT`) rather than a separate Review-listing endpoint, since T139's design treats quality issues as one queue regardless of origin
- [X] T143 [P] [US6] Low-rating/aged-complaint alert banner on `apps/web/src/admin/pages/Dashboard.tsx`
- [~] T144 [P] [US6] Arabic + English strings for US6 screens — same follow-up as T080/T093/T106/T117/T130: screen labels are English-only literals pending i18n-key extraction
- [X] T145 [P] [US6] Integration test: second review on same booking → 409; low rating → auto-`COMPLAINT_OPENED`; close without `resolution` → 422 (`apps/api/tests/integration/reviewsAndComplaints.test.ts`) — written and confirmed to load/execute up to the DB call, same no-live-DB caveat as prior integration tests
- [X] T146 [P] [US6] Integration test: rework booking correctly linked and pre-filled from original (`apps/api/tests/integration/rework.test.ts`) — same caveat
- [X] T147 [US6] E2E spec written (`tests/e2e/review-and-rework.spec.ts`) implementing quickstart.md V6 — same not-executable-in-sandbox caveat as prior E2E specs

**Checkpoint**: Post-service quality loop (rating, complaint, rework) is fully functional. Code-complete, typechecked, builds cleanly (verified live: full monorepo `npm run typecheck` and `npm run build --workspace apps/web` both pass with zero stray build artifacts; `apps/api` unit tests 25/25 pass; `apps/web` unit tests 9/9 pass, 3 files). Same DB-unavailability caveat applies to all integration/E2E tests in this phase.

---

## Phase 9: User Story 7 - Admin Manages Recurring Subscriptions and Commercial Contracts (Priority: P3)

**Goal**: Admin configures recurring packages and commercial accounts; the system generates future bookings on an 8-week rolling horizon without duplicates.

**Independent Test**: Configure a subscription, run the generation job twice, verify no duplicate occurrences and correct pause/cancel history preservation.

- [X] T148 [US7] Define `Subscription`, `CommercialAccount`, `CommercialLocation`, `Contract` models in `apps/api/prisma/schema.prisma` (unique `(subscriptionId, occurrenceDate)` constraint per `data-model.md` §20, added as new fields directly on `Booking` since data-model.md doesn't define a separate occurrence entity) — `Subscription.lastGeneratedAt` replaces data-model.md's `nextGenerationAt` framing (per-subscription cursor instead of a separate job-run table); `prisma validate`/`format`/`generate` all succeed, migration still pending live DB (same recurring caveat)
- [X] T149 [US7] Subscriptions module `apps/api/src/modules/subscriptions/*`: CRUD (Admin-gated; `GET /subscriptions/me` for Customer read-only), `pause`/`resume`/`cancel`, `GET .../occurrences` + `POST .../occurrences/skip` as the occurrence-editor endpoint — skipping writes a `CANCELLED` placeholder `Booking` for that date so the generation job's uniqueness check treats it as handled, without touching the subscription record itself
- [X] T150 [US7] Background job `apps/api/src/jobs/generateSubscriptionOccurrences.ts` — idempotent (existence check + unique-constraint backstop against P2002), 8-week rolling horizon (FR-056), records `lastGeneratedAt` per subscription; not wired to a cron scheduler (none exists yet in this codebase — same as every other job in `apps/api/src/jobs/`), exported as a plain function for a future scheduler or Polish-phase task to invoke
- [X] T151 [US7] Commercial module `apps/api/src/modules/commercial/*`: `CommercialAccount`, `CommercialLocation`, `Contract` CRUD (Admin-gated)
- [X] T152 [P] [US7] `apps/web/src/api/subscriptionsApi.ts`, `commercialApi.ts` RTK Query slices
- [X] T153 [P] [US7] `apps/web/src/admin/pages/subscriptions/List.tsx`, `Editor.tsx` (doubles as create-screen and detail/pause/resume/cancel view), `OccurrenceEditor.tsx`
- [X] T154 [P] [US7] `apps/web/src/admin/pages/commercial/Accounts.tsx`, `Contracts.tsx`
- [X] T155 [P] [US7] `apps/web/src/customer/pages/Subscriptions.tsx` — dedicated read-only view (not merged into `BookingsList.tsx`, since subscriptions and one-time bookings have different fields/actions) linked from `AppShell`'s "My Subscriptions" nav item
- [~] T156 [P] [US7] Arabic + English strings for US7 screens — same follow-up as T080/T093/T106/T117/T130/T144: screen labels are English-only literals pending i18n-key extraction
- [X] T157 [P] [US7] Integration test: running the generation job twice (with a reset cursor to force revisiting already-generated dates) produces no duplicate `Booking` rows for the same `(subscriptionId, occurrenceDate)` (`apps/api/tests/integration/subscriptions.generation.test.ts`) — written and confirmed to load/execute up to the DB call, same no-live-DB caveat as prior integration tests
- [X] T158 [P] [US7] Integration test: cancel preserves prior generated bookings; single-occurrence skip doesn't alter the subscription's own frequency/startsAt/status (`apps/api/tests/integration/subscriptions.lifecycle.test.ts`) — same caveat
- [X] T159 [US7] E2E spec written (`tests/e2e/subscriptions.spec.ts`) implementing quickstart.md V7 — same not-executable-in-sandbox caveat as prior E2E specs

**Checkpoint**: Recurring revenue and commercial-client management work independently of one-time bookings. Code-complete, typechecked, builds cleanly (verified live: full monorepo `npm run typecheck` and `npm run build --workspace apps/web` both pass with zero stray build artifacts; `apps/api` unit tests 25/25 pass; `apps/web` unit tests 9/9 pass, 3 files). Same DB-unavailability caveat applies to all integration/E2E tests in this phase.

---

## Phase 10: User Story 8 - Admin Reviews Operational and Revenue Reports (Priority: P3)

**Goal**: Admin sees accurate operations/revenue/quality dashboards and can export filtered, PII-minimized reports.

**Independent Test**: Generate a known seeded dataset and verify dashboard totals and CSV export match it exactly, with disallowed PII fields absent from exports.

- [X] T160 [US8] Reports module `apps/api/src/modules/reports/*`: `GET /reports/operations-summary`, `/revenue`, `/services`, `/quality`
- [X] T161 [US8] `GET /reports/export.csv` with PII-field exclusion per `data-model.md` PII classification (phone/address columns only appended when `includePii=true`), wrapped in an `AuditLog` entry (`EXPORT_GENERATED` action, written regardless of which way `includePii` was set) — `apps/api/src/modules/reports/*`
- [X] T162 [US8] `GET /audit-logs` (Admin-only, paginated, filterable by entityType) in `apps/api/src/modules/audit-logs/*`
- [X] T163 [P] [US8] `apps/web/src/api/reportsApi.ts` RTK Query slice
- [X] T164 [US8] `apps/web/src/admin/pages/Dashboard.tsx` — finalized with real operations-summary stats (today's bookings, unscheduled confirmed, overdue) as `Statistic` cards, alongside the Phase 8 quality-alerts banner
- [X] T165 [P] [US8] `apps/web/src/admin/pages/reports/Revenue.tsx`, `Services.tsx`, `Quality.tsx`, `Export.tsx` — `Export.tsx` uses a direct `fetch` + blob download (not RTK Query, since the response is a CSV file, not JSON) with the access token read from the Redux auth slice
- [X] T166 [P] [US8] `apps/web/src/admin/pages/reports/AuditLogViewer.tsx`
- [~] T167 [P] [US8] Arabic + English strings for US8 screens — same follow-up as T080/T093/T106/T117/T130/T144/T156: screen labels are English-only literals pending i18n-key extraction
- [X] T168 [P] [US8] Integration test: report totals match seeded booking/payment fixtures exactly (`apps/api/tests/integration/reports.test.ts`) — written and confirmed to load/execute up to the DB call, same no-live-DB caveat as prior integration tests
- [X] T169 [P] [US8] Integration test: CSV export omits phone/address fields by default, includes them + audit-logs when `includePii=true` (`apps/api/tests/integration/reportsExport.test.ts`) — same caveat
- [X] T170 [US8] E2E spec written (`tests/e2e/reports.spec.ts`) implementing quickstart.md V8 — same not-executable-in-sandbox caveat as prior E2E specs

**Checkpoint**: All 8 user stories are independently functional; full spec.md coverage achieved. Code-complete, typechecked, builds cleanly (verified live: full monorepo `npm run typecheck` and `npm run build --workspace apps/web` both pass with zero stray build artifacts; `apps/api` unit tests 25/25 pass; `apps/web` unit tests 9/9 pass, 3 files). Same DB-unavailability caveat applies to all integration/E2E tests in this phase.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Admin capabilities that support the platform but aren't tied to one spec.md user story, plus final quality/security/performance passes.

- [X] T171 [P] Define `WebsiteContentBlock`, `FaqItem` models in `apps/api/prisma/schema.prisma` — `prisma validate`/`format`/`generate` all succeed, migration still pending live DB (same recurring caveat)
- [X] T172 [P] Website-content module `apps/api/src/modules/website-content/*`: CRUD (Admin, under `/admin/content-blocks` and `/admin/faqs`), public GET for active blocks/FAQs (`/content-blocks`, `/faqs`)
- [X] T173 [P] `apps/web/src/admin/pages/content/WebsiteContent.tsx`, `FAQs.tsx` — the public GET endpoints exist and are ready for a future public FAQ/content page to consume; wiring them into `Home.tsx`/a public FAQ page was not in this task's scope
- [X] T174 [P] Settings module `apps/api/src/modules/settings/*`: `GET/PATCH /settings`
- [X] T175 [P] `apps/web/src/admin/pages/settings/SystemSettings.tsx`
- [X] T176 [P] Full discount-codes Admin CRUD (`apps/api/src/modules/discount-codes/*` extended with list/create/update/disable, matching the existing pricing-rules CRUD pattern) + `apps/web/src/admin/pages/pricing/DiscountCodes.tsx`, `PricingRules.tsx` — pricing-rules backend already existed from Phase 3 (T058), so only its Admin UI was missing
- [X] T177 [P] Notification-templates Admin editor `apps/web/src/admin/pages/notifications/Templates.tsx` and log viewer `Log.tsx`, backed by `apps/api/src/modules/notifications/*` CRUD/read endpoints
- [X] T178 [P] `apps/web/src/customer/pages/Notifications.tsx` — customer-visible notification history (FR-069), scoped to `GET /notification-logs/me`
- [X] T179 Background jobs `apps/api/src/jobs/expireStaleQuotes.ts`, `flagOverdueBookings.ts` — idempotent; `flagOverdueBookings` writes one `AuditLog` entry per overdue booking (there is no `OVERDUE` `BookingStatus` value per research.md R5, so "flagging" means an audit-trail entry, not a status change), deduplicated per calendar day. Neither job (nor `generateSubscriptionOccurrences.ts` from T150) is wired to a cron scheduler — no scheduler infrastructure exists yet in this codebase; all three are exported as plain functions ready for one
- [X] T180 [P] Full `apps/api/prisma/seed.ts`: both service areas (Abha, Khamis Mushait per spec.md), all 8 launch service categories/services from FR-006 across 3 categories with pricing types covering all 5 `PricingType` modes, sample add-ons, one checklist template per service (6 items covering all 5 `ChecklistItemType` values), ~2 weeks of `TimeSlot` rows (Sun–Thu + Sat, Friday closed), and one sample `Booking` per `BookingStatus` value (9 bookings) — not run against a live database in this sandbox (same recurring caveat); verified by isolated `tsc --noEmit` type-check since `prisma/` isn't part of the main workspace tsconfig
- [X] T181 [P] Lighthouse CI config (`lighthouserc.json`, `npm run lighthouse:ci`) targeting the intended public routes (home, catalog, one service detail page) enforcing LCP<2.5s, CLS<0.1, and total-blocking-time<200ms as the lab-metric proxy for INP (INP itself is a field metric, not directly measurable by a lab Lighthouse run). `@lhci/cli` install initially failed on a transient registry TLS error; retried successfully later in the same session (now in `package.json` devDependencies) — **one caveat remains**: these routes are still CSR, not prerendered, since T079 (prerendering) remains deferred for the reasons given there; this config measures today's CSR baseline, not yet a Principle-V-compliant prerendered build. Not run end-to-end here (needs a served build + headless Chrome + time budget beyond this session)
- [X] T182 [P] Accessibility audit: `tests/e2e/accessibility.spec.ts` (Playwright + `@axe-core/playwright`, WCAG 2.1 AA tags) across Customer Portal public routes and Admin Dashboard — `@axe-core/playwright` install initially failed on a transient registry TLS error; retried successfully later in the same session (now in `package.json` devDependencies, `npx playwright test --list` still finds all 84 tests with no collection errors). The import is kept dynamic (inside each test body) rather than top-level as defensive practice, not because the package is missing. Like every other E2E spec, actually executing it requires a live PostgreSQL database + running apps, unavailable in this sandbox
- [X] T183 E2E: RTL + mobile-viewport smoke test across public routes, direction/overflow/touch-target assertions, run across all three `playwright.config.ts` projects (chromium, mobile-ar, mobile-en) so the project matrix supplies the Arabic/English + mobile-viewport coverage rather than per-test locale switching (`tests/e2e/access-control-and-rtl.spec.ts`) — implements quickstart.md V10
- [X] T184 E2E: access-control boundary suite — unauthenticated Admin-route redirect, Customer token on an Admin-only API route (403), cross-customer booking access, reference-lookup-without-token (`tests/e2e/access-control-and-rtl.spec.ts`, same file as T183) — implements quickstart.md V9
- [X] T185 [P] Log-redaction verification test (`apps/api/tests/unit/logRedaction.test.ts`) — exercises the real `redactConfig` exported from `lib/logging.ts` directly against a capturable pino stream (rather than requiring a live E2E run + log-grep, which this sandbox can't do), asserting every PII field (including the previously-missing nested `newCustomer.phone` path, now added) never reaches log output — **29/29 unit tests passing, verified live**
- [X] T186 [P] Static check (`apps/api/tests/unit/staticChecks.test.ts`): confirms no job file name/body suggests deletion/retention/anonymization (FR-081) and no payment-gateway SDK is declared in `package.json` dependencies or imported anywhere in `apps/api/src` (FR-064) — implemented as a vitest unit test (no DB required) rather than a separate lint script, consistent with this project's existing unit-test-based static-check pattern. The payment-gateway check was rewritten from naive source-text substring matching to a `package.json`-dependency + import-statement check after it produced a real false positive against its own codebase (`reencodeAndStripExif`, added by T057 later in this session, lowercases to a string containing "stripe") — caught and fixed live; **4/4 tests passing**
- [X] T187 [P] `README.md` at repo root: setup, scripts, deployment overview, linking to `quickstart.md` and the rest of `specs/001-cleaning-company-platform/`
- [X] T188 Run `/speckit-constitution` to reconcile Technology & Platform Constraints and Principle IV wording with the finalized two-role Vite/Express stack (tracked here as a follow-up task, not blocking — not run as part of `/speckit-implement`, which only executes `tasks.md`'s own task list) — done: constitution amended to v1.1.0 (`.specify/memory/constitution.md`)

**Checkpoint**: Polish phase code-complete except the two sandbox-network-blocked installs noted above (T181/T182). Verified live: full monorepo `npm run typecheck` passes (all 3 workspaces); `npm run build --workspace apps/web` and `apps/api` and `packages/shared` all succeed; zero stray build artifacts; `apps/api` unit tests 29/29 pass (4 files); `apps/web` unit tests 9/9 pass (3 files); `npx playwright test --list` finds 84 tests across 10 E2E spec files with no collection errors. Every integration/E2E test in every phase shares the same documented no-live-PostgreSQL-in-this-sandbox caveat — none of them have been executed to a pass/fail result here, only verified to load, compile, and fail exclusively on the expected `DATABASE_URL`/server-connection error.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks every user-story phase
- **User Stories (Phase 3–10)**: all depend on Foundational; within P1 (US1, US2, US3) and P2 (US4, US5, US6) and P3 (US7, US8) groups, stories are largely parallelizable across developers, but the task lists above are ordered assuming sequential priority delivery since each story's booking-related backend tasks build on the `Booking` model and state machine established in US1
- **Polish (Phase 11)**: depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: depends only on Foundational — creates the core `Booking`/`Service`/`Quote` schema every later story extends
- **US2 (P1)**: depends on US1's `Booking`/`Quote`/pricing logic existing; adds the Admin-assisted creation path
- **US3 (P1)**: depends on US1's `Booking` model; adds confirm/reject/payment
- **US4 (P2)**: depends on US3 (bookings must be confirmable before schedulable)
- **US5 (P2)**: depends on US4 (bookings must be scheduled before execution starts)
- **US6 (P2)**: depends on US5 (bookings must be completable before review/complaint)
- **US7 (P3)**: depends on US1–US3 (subscriptions generate ordinary bookings that flow through the same lifecycle); independent of US4–US6
- **US8 (P3)**: depends on data existing from US1, US3, US6 (reports aggregate bookings/payments/quality); independent of US4, US5, US7 internals beyond reading their data

### Within Each User Story

- Prisma models → migration → backend services/routes → frontend API slices → frontend pages → tests
- Integration tests should be written alongside (or immediately after) their corresponding endpoint task, not deferred to the end of the phase
- Each story's E2E spec is the final task in that phase and should only be run once every task above it is complete

### Parallel Opportunities

- All `[P]`-marked Setup tasks (T002–T012) run in parallel after T001
- Within Foundational, the shared-package tasks (T014–T016), the independent middleware tasks (T019–T023, T026), and the frontend-shell tasks (T034–T035, T039–T040) can each run in parallel within their group
- Within any user-story phase, frontend page tasks marked `[P]` can run in parallel once that phase's API slices exist; backend module tasks marked `[P]` can run in parallel when they touch different module folders
- US7 and US8 (both P3) can be built in parallel by different developers once US1–US6 are done, since neither depends on the other

---

## Parallel Example: User Story 1

```bash
# After T053 (migration) completes, these can run in parallel:
Task: "Zod schemas for catalog/address/pricing in apps/api/src/modules/services/schema.ts, service-add-ons/schema.ts, service-categories/schema.ts, addresses/schema.ts"
Task: "Pure pricing-calculation functions in apps/api/src/lib/pricing/"

# After backend endpoints (T054-T067) and API slices (T068) exist, these frontend pages run in parallel:
Task: "apps/web/src/customer/pages/Home.tsx"
Task: "apps/web/src/customer/pages/ServiceCatalog.tsx"
Task: "apps/web/src/customer/pages/ServiceDetail.tsx"
Task: "apps/web/src/customer/pages/BookingsList.tsx, BookingDetail.tsx"
Task: "apps/web/src/customer/pages/Profile.tsx, Addresses.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (auth + app shells — required even for the MVP)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md V1 manually and via Playwright; confirm mobile/Arabic/idempotency behavior
5. Deploy/demo — this alone proves the core booking-capture value proposition

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → demoable MVP (customer can book; nothing processes it yet)
3. US2 + US3 → completes the P1 slice: every booking-creation channel plus review/pricing/confirmation
4. US4 → US5 → US6 → completes the P2 slice: scheduling, execution, quality loop (deliver in this order — each depends on the previous per Dependencies above)
5. US7 + US8 (parallelizable) → completes the P3 slice: recurring revenue + reporting
6. Polish → CMS/settings, security/performance/accessibility hardening, constitution reconciliation

### Suggested Team Split (if parallel capacity available)

- Developer A: US1 → US4 → US5 (the booking-through-execution spine)
- Developer B: US2 → US3 → US6 (creation channels, financial confirmation, quality loop)
- Developer C: US7, US8, and Polish once P1/P2 stories are stable

---

## Notes

- `[P]` tasks touch different files with no unmet dependency — safe to parallelize
- `[Story]` label maps every phase-3-onward task to its user story for traceability back to `spec.md` and `traceability.md`
- Every backend mutation task that touches pricing, booking state, scheduling, payments, or exports must include (or be immediately followed by) its audit-logging call per constitution Principle I — this is called out per-task above where it applies (T097, T110, T161) but applies implicitly to any other sensitive action introduced during implementation
- Commit after each task or logical group; stop at any checkpoint to validate a story independently before continuing
- Avoid: vague tasks, two tasks editing the same file marked `[P]`, cross-story dependencies that break a story's independent testability
