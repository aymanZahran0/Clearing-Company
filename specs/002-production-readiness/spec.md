# Feature Specification: Production Readiness

**Feature Branch**: `002-production-readiness`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Create a new feature named Production Readiness for the existing Nuqaa Asir Cleaning Booking & Operations Platform. This is an incremental feature built on top of the existing 001-cleaning-company-platform implementation. Do not recreate or rewrite features that are already complete. The purpose of this feature is to finish all incomplete and unverified work required before production launch," covering environment/migrations, backend and end-to-end test verification, i18n completion, public-page prerendering, Admin catalog-management completion, public content/FAQ connection, Admin account management, background-job scheduling, real notification delivery, object-storage verification, customer reschedule requests, production deployment/CI/CD/operations, and final production acceptance checks — while preserving the existing implementation, keeping exactly two roles (Customer, Admin), avoiding microservices, keeping Arabic primary/English secondary, following constitution v1.1.0, and clearly distinguishing production blockers from optional integrations.

## Clarifications

### Session 2026-07-14

- Q: Outcome 10 ("actual configurable notification delivery through provider abstractions") could mean real automated delivery for email only, email+SMS, or email+SMS+WhatsApp Business API. Which channels require a real, automated delivery integration for this feature? → A: Email and SMS both get real, configurable provider abstractions. WhatsApp remains the existing manual, Admin-initiated click-to-chat/template flow from the 001 baseline — no WhatsApp Business API integration is required by this feature.
- Q: FR-035 lets an Admin reset *another* Admin's credential, but can an Admin recover their own forgotten password without another Admin's help? → A: Yes — self-service password reset via email is in scope; any Admin can request a reset link themselves, independent of another Admin.
- Q: How often should the subscription-generation, stale-quote-expiration, and overdue-booking-detection jobs run? → A: Every 15 minutes, for all three jobs.
- Q: What's the target maximum staleness for prerendered public pages after an Admin edit to catalog/pricing/content/FAQ data? → A: Immediate, on-demand regeneration — saving a change triggers regeneration of the affected page(s) right away, with effectively no staleness window.

## Scope: Production Blockers vs. Optional Integrations

Everything in this feature is required to reach production launch **except** the specific items called out below as optional/deferred:

- **Blockers (must be true before launch)**: working PostgreSQL environments and migrations/seed; a green backend integration suite; a green end-to-end suite; zero hardcoded user-facing strings with verified Arabic RTL / English LTR layouts; static prerendering of public pages; a complete Admin catalog-management interface; Admin-managed content blocks and FAQs live on the public site; Admin account management with last-Admin protection; reliable, locked, logged background jobs; real (non-blocking) email and SMS notification delivery; a verified real S3-compatible storage integration; the customer reschedule-request workflow with Admin approval/rejection and audit logging; a documented, working deployment/CI-CD/backup/monitoring/rollback setup; and passing final production acceptance checks.
- **Optional / explicitly deferred integrations**: automated WhatsApp Business API delivery (manual click-to-chat remains the WhatsApp mechanism); the specific vendor chosen for email, SMS, S3-compatible storage, hosting, error tracking, or monitoring (any compliant provider may be configured per environment — the abstraction and the verification against one real provider is the blocker, not the vendor choice); and any capability explicitly out of scope in the 001 baseline (online payments, native apps, live GPS, payroll, inventory, photo-based checklists, ZATCA e-invoicing), which remains out of scope here too.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator Stands Up a Working Environment (Priority: P1)

An operator (developer or DevOps) configures a PostgreSQL database for a given environment, runs the existing Prisma migrations, and loads seed data, ending up with a fully working, browsable instance of the platform.

**Why this priority**: Nothing else in this feature — or the 001 baseline — can be verified, tested, or deployed without a working, migrated, seeded database. This is the foundation every other story depends on.

**Independent Test**: Can be fully tested by pointing a fresh, empty PostgreSQL instance at the existing migrations and seed script and confirming the platform starts, the catalog is browsable, and one active Admin account can log in.

**Acceptance Scenarios**:

1. **Given** a freshly created, empty PostgreSQL database, **When** the existing migrations are run, **Then** every migration applies successfully in order with no manual fix-up required.
2. **Given** a freshly migrated database, **When** the seed script runs, **Then** it produces a complete service catalog, at least one active Admin account, and enough service-area/pricing data to exercise every 001 baseline user story.
3. **Given** a database that has already been migrated and seeded, **When** the migration process is run again, **Then** it completes without error, data loss, or duplicate schema objects.
4. **Given** separate local, test, staging, and production configurations, **When** each is configured via its own environment variables, **Then** none of them share credentials or point at the wrong database.

---

### User Story 2 - Backend Integration Suite Runs Clean Against a Real Database (Priority: P1)

A developer runs the full backend integration test suite against a disposable PostgreSQL test database and gets a fully passing result, with any previously broken, flaky, or outdated tests fixed.

**Why this priority**: Integration tests are the primary safeguard for booking, pricing, and scheduling correctness called out in the constitution; a suite that doesn't run clean against a real database provides false confidence going into launch.

**Independent Test**: Can be fully tested by creating a disposable test database, running the integration suite against it, and confirming a 100% pass rate with no test doubles standing in for the database.

**Acceptance Scenarios**:

1. **Given** a disposable, isolated PostgreSQL test database, **When** the backend integration suite runs, **Then** it creates/migrates/tears down that database without touching development or production data.
2. **Given** the full integration suite, **When** it is executed, **Then** every test covering booking lifecycle, pricing/quoting, scheduling, execution/checklist, feedback/complaints, subscriptions, payments, and audit logging passes.
3. **Given** a test that fails because the implementation has legitimately moved on since the test was written, **When** it is investigated, **Then** the test is corrected to match current expected behavior rather than being deleted or skipped.

---

### User Story 3 - End-to-End Suite Runs Clean Against the Full Stack (Priority: P1)

A developer runs the full Playwright end-to-end suite against the real frontend, API, and database running together, and gets a fully passing result.

**Why this priority**: End-to-end tests are the only check that validates the customer- and Admin-facing flows work together as a whole, including cross-cutting concerns like locale and layout; this must be trustworthy before launch.

**Independent Test**: Can be fully tested by starting the frontend, API, and a real database, running the full Playwright suite against them, and confirming every scenario passes without mocking any tier.

**Acceptance Scenarios**:

1. **Given** the frontend, API, and database all running together, **When** the end-to-end suite executes, **Then** it covers the customer booking flow, the Admin phone/WhatsApp booking flow, quote review/confirmation, scheduling, execution/checklist completion, and feedback/complaint handling end to end.
2. **Given** the end-to-end suite, **When** it runs, **Then** it includes checks confirming both Arabic RTL and English LTR layouts render and function correctly for booking-critical screens.
3. **Given** a previously broken or flaky end-to-end test, **When** it is investigated, **Then** it is fixed or updated so the full suite passes reliably, not silently skipped or deleted.

---

### User Story 4 - Admin Completes the Service Catalog Without Engineering Help (Priority: P1)

Admin manages the entire service catalog — categories, services, add-ons, images, pricing rules, activation, and display order — end to end through the Admin interface, with a clear checklist showing what's left to configure.

**Why this priority**: The business cannot operate or launch if Admin depends on engineers to add a service, fix a price, or reorder the catalog; this is core day-one operational capability.

**Independent Test**: Can be fully tested by having Admin, starting from an empty or partial catalog, create a category, add services and add-ons to it, attach images, configure pricing rules, set display order, and activate everything — with the result immediately reflected in what customers can book — without any direct database or code change.

**Acceptance Scenarios**:

1. **Given** Admin is on the catalog-management screen, **When** Admin creates a category, adds services and add-ons, uploads images, and sets pricing rules, **Then** each of those objects is saved and editable without engineering involvement.
2. **Given** a service or add-on is not yet fully configured, **When** Admin views the catalog checklist, **Then** it clearly shows which steps remain (e.g., pricing missing, image missing, not yet activated) and links directly to fix them.
3. **Given** a category, service, or add-on is deactivated, **When** a customer browses the catalog, **Then** it no longer appears as bookable, while existing bookings that already reference it are unaffected.
4. **Given** Admin reorders categories, services, or add-ons, **When** a customer or Admin views the catalog, **Then** the new order is reflected immediately.

---

### User Story 5 - Admin-Managed Website Content Reaches the Public Site (Priority: P1)

Admin edits website content blocks (e.g., homepage sections, company information, service-area descriptions) and FAQ entries, and those edits appear on the live public website in both Arabic and English without requiring a new deployment.

**Why this priority**: A production launch cannot depend on engineers editing marketing copy or FAQs in code; content ownership must sit with Admin from day one.

**Independent Test**: Can be fully tested by having Admin edit an existing content block or add a new FAQ entry in both locales and independently confirming the public site reflects the change, in the correct locale, without a code deployment.

**Acceptance Scenarios**:

1. **Given** Admin edits a content block's Arabic and English text, **When** a visitor loads the corresponding public page in either locale, **Then** the visitor sees the updated text in their active locale.
2. **Given** Admin adds, edits, or reorders an FAQ entry, **When** a visitor loads the public FAQs page, **Then** the change is reflected there in the visitor's active locale.
3. **Given** a content block or FAQ entry has no translation yet in the visitor's active locale, **When** the visitor loads the page, **Then** the primary-locale (Arabic) content is shown rather than a blank section.
4. **Given** Admin sets a content block or FAQ entry to draft, **When** a visitor loads the public site, **Then** that entry does not appear.

---

### User Story 6 - Admin Manages Other Admin Accounts Safely (Priority: P2)

Admin views the list of Admin accounts, invites or directly creates new ones, suspends or reactivates existing ones, and resets an Admin's access — while the system guarantees the last active Admin account can never be suspended or removed.

**Why this priority**: The business needs more than one person able to operate the system and needs to be able to revoke access (e.g., when someone leaves) without ever locking everyone out; this is an operational-safety requirement rather than a day-one revenue driver, so it follows the P1 launch blockers.

**Independent Test**: Can be fully tested by having an Admin invite a second Admin, confirming the second Admin can log in, suspending and reactivating that second Admin, resetting their access, and finally confirming that suspending the sole remaining active Admin is blocked.

**Acceptance Scenarios**:

1. **Given** Admin invites a new Admin by contact details, **When** the invite is sent, **Then** the new Admin receives a way to establish their own access without the inviter setting or knowing their credential.
2. **Given** Admin instead directly creates a new Admin account, **When** that account is created, **Then** it is usable immediately with an initial credential.
3. **Given** more than one active Admin account exists, **When** an Admin suspends another, **Then** the suspended account can no longer authenticate or act, but its history remains visible.
4. **Given** a suspended Admin account, **When** an Admin reactivates it, **Then** it can authenticate and act again.
5. **Given** exactly one active Admin account remains, **When** any attempt is made to suspend, deactivate, or remove it, **Then** the system blocks the action and explains why.
6. **Given** an Admin resets another Admin's access, **When** the reset completes, **Then** the old credential no longer works and the target Admin is notified how to establish a new one.
7. **Given** an Admin has forgotten their own password, **When** they request a self-service password reset via email, **Then** they can establish a new credential themselves without needing another Admin to act on their behalf.

---

### User Story 7 - Background Jobs Run Reliably Without Duplication (Priority: P1)

The subscription-occurrence-generation, stale-quote-expiration, and overdue-booking-detection jobs run automatically on schedule, never run the same period's work twice even if retried or overlapped, and log every success and failure Admin can review.

**Why this priority**: These jobs already exist in the 001 baseline but are not verified to run unattended in production; without reliable scheduling and duplicate protection, subscriptions silently stop generating bookings, quotes never expire, and overdue bookings go unnoticed.

**Independent Test**: Can be fully tested by letting each job run on its schedule against test data, confirming expected effects occur exactly once, then forcing a duplicate/overlapping run and confirming no duplicate effects and a clear log entry.

**Acceptance Scenarios**:

1. **Given** an active subscription due for occurrence generation, **When** the job runs on its 15-minute schedule, **Then** the correct future occurrences are created exactly once.
2. **Given** the same job is triggered twice for the same period (e.g., a retry or an overlapping schedule), **When** both attempts run, **Then** only one applies its effects; the other detects the lock and safely no-ops.
3. **Given** a job run fails partway through, **When** the failure occurs, **Then** it is logged with enough detail to diagnose, and no partially-applied change is left in an inconsistent state.
4. **Given** Admin wants to confirm jobs are healthy, **When** Admin reviews job run history, **Then** every run's status (success/failure), start/end time, and failure reason (if any) is visible.

---

### User Story 8 - Notifications Actually Get Delivered (Priority: P1)

Booking- and account-related notifications are sent through real, configurable email and SMS providers, while a delivery failure on any channel (including the existing manual WhatsApp flow) never blocks the underlying booking or account action.

**Why this priority**: The 001 baseline only prepares WhatsApp templates manually; without real automated delivery, customers and Admin accounts (e.g., invites, password resets) have no reliable way to receive confirmations, reminders, or access instructions at launch.

**Independent Test**: Can be fully tested by triggering a booking event (e.g., confirmation) and an Admin account event (e.g., invite) and confirming a real email and, where a phone number is available, a real SMS are sent — then confirming a simulated provider outage still lets the underlying action succeed while logging the failure.

**Acceptance Scenarios**:

1. **Given** a booking event that should notify the customer, **When** the event occurs, **Then** a real email is sent through the configured provider, and a real SMS is sent if the customer's phone number is available and SMS applies to that event.
2. **Given** an Admin account event (invite, credential reset), **When** it occurs, **Then** the target Admin receives a real email with instructions to establish or reset access.
3. **Given** the configured email or SMS provider is unavailable or returns an error, **When** a notification attempt is made, **Then** the underlying booking or account action still completes successfully, and the failure is logged with recipient, channel, template, and reason.
4. **Given** Admin wants to confirm a notification reached its recipient, **When** Admin views a booking or Admin-account's notification history, **Then** the delivery status (sent/failed/pending) of each attempt is visible.
5. **Given** WhatsApp is the intended channel, **When** an Admin wants to notify a customer, **Then** Admin still uses the existing manual click-to-chat/template flow — no automatic WhatsApp Business API send occurs.

---

### User Story 9 - File Storage Works Against a Real Provider (Priority: P1)

Catalog images and other uploaded files are verified to upload, store, and retrieve correctly against a real S3-compatible storage provider, with credentials held only in environment configuration.

**Why this priority**: Admin's catalog-management work (User Story 4) and any other file upload depend entirely on storage actually working outside of local/mocked conditions; an unverified integration is a launch blocker hiding in plain sight.

**Independent Test**: Can be fully tested by uploading a file (e.g., a service image) through the Admin interface in an environment configured against a real S3-compatible provider, and independently confirming it can be retrieved and displayed on the public site.

**Acceptance Scenarios**:

1. **Given** Admin uploads an image against a real, configured S3-compatible provider, **When** the upload completes, **Then** the file is retrievable and displays correctly wherever it is referenced.
2. **Given** storage credentials and endpoint configuration, **When** the environment is inspected, **Then** none of it is hardcoded or present in source control.
3. **Given** the storage provider returns an error or times out, **When** Admin attempts an upload, **Then** Admin sees a clear error message and the attempt is not silently discarded.

---

### User Story 10 - Customer Requests a Reschedule, Admin Approves or Rejects (Priority: P2)

A customer with an upcoming booking requests a new date/time themselves; Admin reviews the request and approves or rejects it, and every step is recorded in an auditable history.

**Why this priority**: This is a genuinely new customer-facing capability (not present in the 001 baseline, where only Admin could reschedule), so it follows the launch-blocking verification/operations work but remains required before this feature is considered done.

**Independent Test**: Can be fully tested by having a test customer submit a reschedule request against an upcoming booking, then independently walking it through Admin approval (confirming the booking's schedule updates) and, separately, through Admin rejection (confirming the original schedule is unchanged) — with both paths leaving a full audit trail.

**Acceptance Scenarios**:

1. **Given** a customer has an upcoming booking, **When** they submit a reschedule request with a preferred new date/time, **Then** the request is recorded as pending and visible to Admin.
2. **Given** a pending reschedule request, **When** Admin approves it, **Then** the booking's schedule updates to the new date/time (subject to the same slot-capacity checks as any other reschedule), and the customer is notified of the approval.
3. **Given** a pending reschedule request, **When** Admin rejects it, **Then** the booking's original schedule is unchanged, and the customer is notified of the rejection along with any reason Admin provides.
4. **Given** a booking already has a pending, unresolved reschedule request, **When** the customer tries to submit another one for the same booking, **Then** the system prevents a second pending request until the first is resolved.
5. **Given** any reschedule request is submitted, approved, or rejected, **When** the action is saved, **Then** an audit entry records who acted, when, and why.

---

### User Story 11 - The Platform Is Deployed, Monitored, and Recoverable (Priority: P1)

An operator deploys the platform to staging and production using a documented, repeatable process with CI checks, environment variables, backups, monitoring, health checks, error tracking, HTTPS, and a tested rollback procedure.

**Why this priority**: None of the other launch-readiness work matters if the platform cannot actually be deployed, observed, and recovered in a real production environment; this is the final gate before customers can use the system.

**Independent Test**: Can be fully tested by following the documented deployment procedure to stand up a staging environment from a clean state, confirming CI blocks a broken change, confirming a backup can be restored, confirming health checks and error tracking report accurately, and confirming a rollback restores the previous working version.

**Acceptance Scenarios**:

1. **Given** a documented deployment procedure, **When** it is followed for staging or production, **Then** it succeeds without undocumented manual steps, using only environment-specific configuration.
2. **Given** a proposed change with a failing test, lint, or type check, **When** it goes through CI, **Then** it is blocked from being merged or deployed.
3. **Given** a production backup exists, **When** a restore is performed as a drill, **Then** the restored environment matches the backed-up state and the procedure is confirmed to work.
4. **Given** the platform is running in staging or production, **When** its health-check endpoint is queried, **Then** it accurately reflects whether the API and database are truly ready to serve traffic.
5. **Given** an unhandled error occurs in staging or production, **When** it happens, **Then** it is captured by error tracking with enough context to diagnose it.
6. **Given** a newly deployed version has a serious problem, **When** the rollback procedure is executed, **Then** the previous known-good version (and database state, if needed) is restored within the documented time target.
7. **Given** any staging or production traffic, **When** it is inspected, **Then** it is served only over HTTPS.

---

### User Story 12 - Final Production Acceptance Sign-Off (Priority: P1)

Before launch, the platform is checked end to end against security, accessibility, mobile responsiveness, Arabic RTL, English LTR, performance, SEO, data-privacy, and operational-recovery criteria, and every launch-blocking finding is resolved.

**Why this priority**: This is the final confirmation gate that ties together every other story in this feature; launch should not proceed until this check is complete, but it necessarily comes last because it verifies the other stories' outcomes.

**Independent Test**: Can be fully tested by running the full acceptance check against a staging environment that already reflects all other completed stories in this feature, and confirming a documented sign-off with zero unresolved launch-blocking findings.

**Acceptance Scenarios**:

1. **Given** the platform in a staging environment representative of production, **When** the security review is performed, **Then** authentication, authorization, input validation, and secrets handling are confirmed sound.
2. **Given** the same environment, **When** the accessibility check runs, **Then** public and booking-critical Admin flows meet WCAG 2.1 AA with zero unresolved blocking violations.
3. **Given** the same environment, **When** it is checked at a 360px-wide viewport, **Then** every public and booking-critical flow remains fully usable without horizontal scrolling.
4. **Given** the same environment, **When** it is checked in Arabic RTL and separately in English LTR, **Then** every flow works correctly and without layout defects in both directions.
5. **Given** the same environment, **When** performance is measured on public pages under a throttled mobile profile, **Then** Core Web Vitals meet the constitution's "Good" thresholds.
6. **Given** the same environment, **When** SEO is checked on prerendered public pages, **Then** metadata, hreflang alternates, and sitemap entries are correct and complete.
7. **Given** the same environment, **When** data-privacy rules are checked, **Then** booking-reference-only lookups, log redaction, and export redaction from the 001 baseline are all confirmed intact.
8. **Given** the operational-recovery drill from User Story 11, **When** it is referenced in this final check, **Then** it is confirmed to have already succeeded at least once.
9. **Given** the completed checks, **When** any finding is classified as launch-blocking, **Then** it is resolved before launch; non-blocking findings are recorded for post-launch follow-up rather than silently dropped.

### Edge Cases

- What happens when a migration fails partway through on a production or staging database? The system MUST leave the database in a state where the failure is clearly reported and the migration can be safely retried or rolled back, rather than leaving schema in an ambiguous half-applied state.
- What happens when a backend or end-to-end test cannot be made to pass without changing already-shipped 001 baseline behavior? That conflict MUST be surfaced explicitly (test vs. behavior) rather than silently deleting or permanently skipping the test.
- What happens when a translation is missing for a given string in the non-primary locale? The system MUST fall back to the primary (Arabic) text rather than showing a blank, a raw translation key, or crashing the screen.
- What happens when Admin edits catalog or content data while a public page prerender is in flight? The system MUST ensure the next served prerender reflects the latest saved data rather than serving a mix of old and new content.
- What happens when Admin attempts to deactivate the only service in an otherwise-empty catalog? The system MUST allow it (Admin's operational choice) but MUST make the resulting empty public catalog state clearly intentional rather than looking like a bug.
- What happens when an Admin invite is sent to a contact that is already an active Admin? The system MUST reject the duplicate invite and explain that the account already exists.
- What happens when the sole active Admin's credential is lost? Self-service password reset lets them recover access via their registered email without needing another Admin. Only if that registered email account is also inaccessible MUST the system fall back to a documented, secure, out-of-band recovery procedure (distinct from both the in-app self-service reset and the "reset another Admin's access" flow, since no other Admin is available to perform it).
- What happens when two background job triggers fire for the same job within the same locking window (e.g., a manual trigger during a scheduled run)? Only one MUST proceed; the other MUST detect the lock, skip safely, and log that it skipped.
- What happens when both the email and SMS providers are unavailable at the same time for a notification? The underlying action MUST still succeed, and the failure MUST be logged for both channels so Admin can manually follow up.
- What happens when a customer submits a reschedule request for a booking that Admin cancels before deciding on the request? The system MUST resolve the now-moot pending request (e.g., auto-reject with a clear reason) rather than leaving it permanently pending against a cancelled booking.
- What happens when a reschedule request's preferred new time is now unavailable by the time Admin reviews it? Admin MUST be able to reject it with that reason, or approve a different time in consultation with the customer outside the system, without the system silently applying an invalid slot.
- What happens when a rollback is executed after a database migration has already run for the new version? The rollback procedure MUST address the database migration state explicitly (e.g., a compatible down-migration or a documented manual step), not assume rollback is code-only.

## Requirements *(mandatory)*

### Functional Requirements

#### Environment, Migrations & Seed Data

- **FR-001**: System MUST provide a documented, repeatable procedure to configure a PostgreSQL database per environment (local, test, staging, production) using only environment-specific configuration, with no hardcoded credentials.
- **FR-002**: System MUST apply all existing database migrations, in order, to a freshly created empty database without manual intervention or error.
- **FR-003**: System MUST provide seed data producing a complete, browsable service catalog, at least one active Admin account, and enough service-area/pricing configuration to exercise every 001 baseline user story.
- **FR-004**: System MUST support re-running the migration process against an already-migrated database without data loss or duplicate schema objects.

#### Backend Integration Test Verification

- **FR-005**: System MUST provide a disposable, isolated PostgreSQL test database that can be created, migrated, and torn down for automated test runs without affecting development or production data.
- **FR-006**: All backend integration tests MUST pass against that disposable database, covering booking lifecycle, pricing/quoting, scheduling, execution/checklist, feedback/complaints, subscriptions, payments, and audit logging.
- **FR-007**: Any backend integration test found broken, flaky, or outdated relative to current behavior MUST be fixed or updated (not deleted or permanently skipped) so the full suite passes.

#### End-to-End Test Verification

- **FR-008**: System MUST support running the full Playwright end-to-end suite against the real frontend, API, and database running together.
- **FR-009**: All end-to-end tests MUST pass, covering at minimum the customer booking flow, Admin phone/WhatsApp booking flow, quote review/confirmation, scheduling, execution/checklist completion, feedback/complaint handling, and Arabic RTL / English LTR checks on booking-critical screens.
- **FR-010**: Any end-to-end test found broken, flaky, or outdated relative to current behavior MUST be fixed or updated (not deleted or permanently skipped) so the full suite passes.

#### Internationalization Completion

- **FR-011**: System MUST source every user-facing string, in both Admin-facing and customer-facing interfaces, from the i18n translation layer, with no hardcoded literal UI text remaining in either language.
- **FR-012**: System MUST provide complete Arabic and English translations for every user-facing string audited into scope by this feature.
- **FR-013**: System MUST render every screen correctly in both right-to-left (Arabic) and left-to-right (English) layouts, with no visual overlap, clipped text, or misaligned controls.
- **FR-014**: System MUST preserve the user's current screen and data context when the active locale is switched, rather than forcing navigation back to a default screen.

#### Public Page Prerendering

- **FR-015**: System MUST statically prerender, per locale, the home page, service catalog, each service's detail page, the service-areas page, the FAQs page, and public content pages, so their primary content is present without requiring client-side JavaScript execution.
- **FR-016**: System MUST regenerate the affected prerendered public page(s) on demand, immediately when Admin saves a change to catalog, pricing display, service-area, content-block, or FAQ data, so prerendered pages never serve stale content.
- **FR-017**: Prerendered public pages MUST include correct per-locale metadata (title, description, hreflang alternates) consistent with constitution Principle V.

#### Admin Catalog-Management Completion

- **FR-018**: System MUST let Admin create, edit, and deactivate service categories.
- **FR-019**: System MUST let Admin create, edit, activate/deactivate, and reorder services within a category.
- **FR-020**: System MUST let Admin create, edit, activate/deactivate, and reorder add-ons, including which services each add-on applies to.
- **FR-021**: System MUST let Admin upload, replace, reorder, and remove images associated with a category or service.
- **FR-022**: System MUST let Admin create, edit, and deactivate pricing rules (including discounts and travel fees) without engineering involvement.
- **FR-023**: System MUST let Admin control the display order of categories, services, and add-ons shown to customers.
- **FR-024**: Admin catalog-management screens MUST present a checklist or progress indicator of catalog-completeness steps per item (e.g., pricing configured, image added, activated) that links directly to any incomplete step.
- **FR-025**: Deactivating a category, service, or add-on MUST immediately remove it from public booking options while preserving its historical data on existing bookings.

#### Public Content & FAQ Connection

- **FR-026**: System MUST let Admin manage website content blocks (e.g., homepage sections, company information, service-area descriptions) and reflect edits on the live public website without a code deployment.
- **FR-027**: System MUST let Admin manage FAQ entries (question, answer, category, order) and reflect edits on the public FAQs page without a code deployment.
- **FR-028**: Content blocks and FAQ entries MUST support both Arabic and English content; the public site MUST render the entry matching the visitor's active locale and fall back to the primary (Arabic) locale when a translation is missing.
- **FR-029**: System MUST let Admin control the publish state (draft/published) and order of content blocks and FAQ entries.

#### Admin Account Management

- **FR-030**: System MUST let an authenticated Admin view a list of all Admin accounts and each one's status (active, invited, suspended).
- **FR-031**: System MUST let an authenticated Admin invite a new Admin by contact details, giving the invitee a way to establish their own access without the inviter setting or knowing their credential.
- **FR-032**: System MUST let an authenticated Admin directly create a new Admin account with an initial credential when invitation delivery is not desired or available.
- **FR-033**: System MUST let an authenticated Admin suspend another Admin account, immediately preventing that account from authenticating or acting, without deleting its historical audit trail.
- **FR-034**: System MUST let an authenticated Admin reactivate a previously suspended Admin account.
- **FR-035**: System MUST let an authenticated Admin reset another Admin's access credential, immediately invalidating the old one.
- **FR-036**: System MUST let any authenticated Admin self-service reset their own forgotten password via a real email link, without requiring another Admin's involvement.
- **FR-037**: System MUST prevent the last remaining active Admin account from being suspended, deactivated, or removed by any means, guaranteeing at least one active Admin account always exists.
- **FR-038**: System MUST record an audit entry for every Admin account invite, creation, suspension, reactivation, and credential reset (whether self-service or admin-initiated).

#### Background Job Scheduling & Reliability

- **FR-039**: System MUST run the subscription-occurrence-generation job, the stale-quote-expiration job, and the overdue-booking-detection job automatically every 15 minutes, without manual triggering.
- **FR-040**: System MUST prevent two overlapping executions of the same background job from running concurrently, using a locking mechanism that safely no-ops the losing attempt.
- **FR-041**: System MUST log the outcome (success, failure, and reason) of every background job execution in a way Admin can review.
- **FR-042**: A background job failure MUST be logged with enough detail to diagnose and MUST NOT leave partially-applied changes that corrupt booking, subscription, or quote data.
- **FR-043**: System MUST guarantee that re-running a job for an already-processed period does not create duplicate booking occurrences, duplicate expirations, or duplicate overdue flags.

#### Real Notification Delivery

- **FR-044**: System MUST send booking-event and Admin-account-event notifications through a configurable, real email delivery provider.
- **FR-045**: System MUST send the same class of notifications through a configurable, real SMS delivery provider wherever a recipient's phone number is available and SMS applies to that event.
- **FR-046**: The notification-delivery mechanism MUST be provider-agnostic at its integration boundary, so the underlying email or SMS provider can be swapped via configuration without changing the logic that triggers notifications.
- **FR-047**: WhatsApp notification delivery MUST remain the existing manual, Admin-initiated click-to-chat/template flow from the 001 baseline; this feature does not add an automated WhatsApp Business API integration.
- **FR-048**: A failure to deliver any notification (email, SMS, or WhatsApp) MUST NOT block, delay, reverse, or roll back the underlying booking, subscription, or account action, and MUST be logged with recipient, channel, template, and failure reason.
- **FR-049**: System MUST let Admin view the delivery status (sent/failed/pending) of notifications tied to a booking or Admin-account action.

#### Object Storage Verification

- **FR-050**: System MUST verify that file uploads and their subsequent retrieval work end-to-end against a real S3-compatible storage provider, not only a local or mocked filesystem.
- **FR-051**: System MUST keep storage provider credentials and endpoint configuration entirely in environment-specific configuration, never hardcoded or committed to source control.
- **FR-052**: System MUST surface a clear error to Admin when a storage provider error (upload failure, timeout, unavailability) occurs, rather than silently discarding the attempted upload.

#### Customer Reschedule Requests

- **FR-053**: System MUST let a customer request a reschedule of their own upcoming booking to a different date/time, without requiring Admin to have initiated the change.
- **FR-054**: System MUST require Admin to approve or reject each reschedule request; approval MUST apply the new date/time to the booking subject to the same slot-capacity checks as any other reschedule, and rejection MUST leave the original schedule unchanged.
- **FR-055**: System MUST notify the customer of a reschedule request's outcome (approved or rejected) once Admin decides.
- **FR-056**: System MUST record a full audit entry for every reschedule request's submission, approval, or rejection, including who acted, when, and any reason given.
- **FR-057**: System MUST prevent a customer from submitting a new reschedule request for a booking that already has a pending, unresolved reschedule request.
- **FR-058**: System MUST allow a customer to request a reschedule at any time up until the booking's currently scheduled appointment time, consistent with the existing cancellation policy.

#### Production Deployment & Operations

- **FR-059**: System MUST provide a documented, repeatable deployment procedure covering staging and production environments, including required environment variables and their purpose.
- **FR-060**: System MUST run automated checks (tests, linting, type-checking) via CI on every change before it can be merged or deployed.
- **FR-061**: System MUST provide a documented, tested backup procedure for the production database and a documented restore procedure.
- **FR-062**: System MUST expose a health-check mechanism reflecting the true readiness of the API and its database connection.
- **FR-063**: System MUST integrate error tracking that captures unhandled backend and frontend errors in staging and production with enough context to diagnose them.
- **FR-064**: System MUST provide monitoring/alerting for service availability and for the background jobs defined under Background Job Scheduling & Reliability.
- **FR-065**: System MUST serve all production and staging traffic over HTTPS only.
- **FR-066**: System MUST provide a documented rollback procedure that restores the previous known-good deployment and, if needed, database state, within a defined time target.

#### Final Production Acceptance

- **FR-067**: System MUST pass a documented security review covering authentication, authorization, input validation, and secrets handling before launch sign-off.
- **FR-068**: System MUST pass an accessibility check (WCAG 2.1 AA) on all public and booking-critical Admin flows before launch sign-off.
- **FR-069**: System MUST pass a mobile-responsiveness check at a 360px-wide viewport for all public and booking-critical flows before launch sign-off.
- **FR-070**: System MUST pass a full functional check in Arabic RTL layout and a full functional check in English LTR layout before launch sign-off.
- **FR-071**: System MUST pass a performance check against the constitution's Core Web Vitals "Good" thresholds on public pages before launch sign-off.
- **FR-072**: System MUST pass an SEO check (metadata, hreflang, sitemap, crawlability) on all prerendered public pages before launch sign-off.
- **FR-073**: System MUST pass a data-privacy check confirming booking-reference lookup protection, log redaction, and export redaction from the 001 baseline remain intact.
- **FR-074**: System MUST demonstrate at least one successful operational-recovery drill (backup restore or rollback execution) before launch sign-off.
- **FR-075**: Every launch-blocking finding from FR-067 through FR-074 MUST be resolved before production launch; non-blocking findings MUST be recorded for post-launch follow-up rather than silently dropped.

### Key Entities

- **Admin Account** *(extends the existing Admin role)*: An individual Admin's authentication identity, with a status of active, invited, or suspended; tracks who invited or created it and its credential-reset history. At least one Admin Account must always be active.
- **Reschedule Request**: A customer-submitted request to move a specific booking to a new date/time, with a status (pending, approved, rejected), the requested new date/time, who submitted it, who decided it, when, and any reason.
- **Notification Provider Configuration**: Environment-specific configuration identifying which real email and SMS provider is active for sending notifications, independent of the booking/account logic that triggers them.
- **Background Job Run**: A record of one execution of a scheduled job (subscription-occurrence generation, stale-quote expiration, overdue-booking detection), including start/end time, outcome (success/failure), and failure detail; used to enforce locking and provide Admin-visible history.
- **Content Block**: An Admin-managed piece of public website content (e.g., a homepage section or company-information text) with Arabic and English content, a publish state, and a display order.
- **FAQ Entry**: An Admin-managed question-and-answer pair with Arabic and English content, a category, a publish state, and a display order, shown on the public FAQs page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every existing database migration applies successfully, in order, to a freshly created database, and the resulting seeded instance can demonstrate all 001 baseline user stories without manual data fixes.
- **SC-002**: 100% of backend integration tests pass against a disposable PostgreSQL test database, with zero tests permanently skipped or deleted to avoid a failure.
- **SC-003**: 100% of Playwright end-to-end tests pass against the real running frontend, API, and database, with zero tests permanently skipped or deleted to avoid a failure.
- **SC-004**: Zero hardcoded user-facing strings remain outside the i18n layer, and every screen renders correctly in both Arabic RTL and English LTR with no visual defects.
- **SC-005**: The home page, service catalog, service detail pages, service-areas page, FAQs page, and public content pages are all served as statically prerendered content that reflects Admin's latest catalog and content edits immediately, via on-demand regeneration triggered by the save.
- **SC-006**: Admin can take a brand-new category from creation through fully configured (services, add-ons, images, pricing, activation, ordering) using only the Admin interface, with zero engineering involvement.
- **SC-007**: 100% of content-block and FAQ edits made by Admin appear correctly on the public site, in the correct locale, without a code deployment.
- **SC-008**: At least two Admin accounts can be independently invited or created, suspended, and reactivated; 100% of attempts to suspend, deactivate, or remove the last remaining active Admin account are blocked.
- **SC-009**: All three scheduled background jobs run automatically every 15 minutes with zero duplicate effects across retries or overlapping runs, and 100% of job failures are logged with diagnosable detail.
- **SC-010**: 100% of booking-event and Admin-account-event notifications attempt real delivery via the configured email and (where applicable) SMS provider, and 100% of delivery failures are logged without blocking the underlying action.
- **SC-011**: File uploads and downloads succeed end-to-end against a real, configured S3-compatible storage provider in a production-like environment, with zero hardcoded credentials found in source control.
- **SC-012**: Customers can submit a reschedule request on an eligible booking, and 100% of submitted requests are visible to Admin with a complete, accurate audit trail of submission, approval, or rejection.
- **SC-013**: A documented deployment procedure produces a working staging environment from a clean state, and at least one rollback and one backup-restore drill succeed within their documented time targets.
- **SC-014**: The final production acceptance check (security, accessibility, mobile, Arabic RTL, English LTR, performance, SEO, data privacy, operational recovery) completes with zero unresolved launch-blocking findings.

## Assumptions

1. This feature builds entirely on the 001 baseline's data model, roles, and workflows; nothing already complete in 001 is redesigned, only completed, verified, connected, or made production-operational.
2. Exactly two roles remain: Customer (unauthenticated, public) and Admin (authenticated). Admin account management (Outcome 8) adds lifecycle states (invited/active/suspended) to individual Admin identities, but does not introduce any new role type.
3. Real automated notification delivery is required for email and SMS; WhatsApp remains the existing manual, Admin-initiated click-to-chat/template flow and does not require a WhatsApp Business API integration (per this feature's clarification).
4. The specific vendors used for email, SMS, S3-compatible storage, hosting, error tracking, and monitoring are environment configuration choices, not scope decisions; this feature requires the provider abstraction plus verification against one real provider per category, not a named vendor.
5. Admin invites and self-service password resets are both delivered via the real email channel introduced by this feature; the direct-creation path (FR-032) exists as a fallback when email delivery is not desired or available for a given new Admin.
6. Reschedule requests apply to any individual booking with a future scheduled appointment, including a single upcoming occurrence of a subscription, consistent with how Admin can already adjust one occurrence without affecting the whole subscription (001 baseline).
7. "Static prerendering" means public page content is present and crawlable without requiring client-side JavaScript execution; per this feature's clarification, pages are kept in sync with Admin edits via immediate, on-demand regeneration triggered by the save (not a periodic rebuild).
8. A "defined time target" for rollback (FR-066) is an operational parameter to be finalized during planning; this specification requires that such a target exist, be documented, and be met, without fixing its exact value here. The background-job cadence (every 15 minutes, per this feature's clarification) and the prerendered-content freshness target (immediate/on-demand) are both already fixed and do not need further planning-time decisions.
9. The disposable PostgreSQL test database (Outcome 2) and the production/staging databases (Outcome 1) are separate environments by construction; test runs never touch development, staging, or production data.
10. Everything explicitly out of scope in the 001 baseline (online payments, native apps, live GPS, payroll, inventory, photo-based checklists, formal ZATCA e-invoicing) remains out of scope for this feature as well.
