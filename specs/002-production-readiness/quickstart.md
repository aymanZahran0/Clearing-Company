# Quickstart: Validating Production Readiness

This is a validation guide, not an implementation guide — it proves each user story in `spec.md` works end-to-end once implemented. See `data-model.md` and `contracts/` for exact shapes; this file only sequences runnable checks.

## Prerequisites

- Node.js ≥22, npm, Docker (for a disposable PostgreSQL + MinIO), this repo checked out on `002-production-readiness`.
- `apps/api/.env` and `apps/web/.env` populated from their `.env.example` files, including the new `EMAIL_SMTP_*`, `SMS_PROVIDER_*`, `OBJECT_STORAGE_*`, and `SENTRY_DSN`/`VITE_SENTRY_DSN` variables (a sandbox/test-mode value is fine for email/SMS/Sentry during validation).

## 1. Environment, migrations, seed (User Story 1)

```
docker run --rm -d --name pr-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
npm run --workspace apps/api prisma:migrate
npm run --workspace apps/api prisma:seed
```
**Expected**: both commands exit 0 against the freshly created empty database; re-running `prisma:migrate` a second time is also a no-op success (FR-004).

## 2. Backend integration suite against a disposable database (User Story 2)

```
npm run test:integration --workspace apps/api
```
**Expected**: 100% pass, including new `admin-accounts`, `reschedule-requests`, `jobs`, `notifications`, `objectStorage` test files (research.md R6/R7/R1-R2/R3-R5/R16).

## 3. End-to-end suite against the full stack (User Story 3)

```
npm run build
npm run test:e2e
```
**Expected**: all specs in `tests/e2e/` pass, including the new ones listed in research.md R13. Run once with `--project=mobile-ar` and once with `--project=mobile-en` to confirm both locale projects pass (already defined in `playwright.config.ts`).

## 4. Admin catalog management (User Story 4)

Manually (or via `admin-catalog-management.spec.ts`): log in as Admin → `/admin/catalog/categories` → create a category → add a service to it → add an add-on → upload an image (`/admin/catalog/services/:slug/images`) → set a pricing rule (`/admin/pricing/rules`) → activate everything → confirm the catalog checklist page shows all green → confirm the item is now bookable at `/services`.

## 5. Public content & FAQ connection (User Story 5)

Edit a `WebsiteContentBlock` and a `FaqItem` in `/admin/content/website` and `/admin/content/faqs` → reload the public `/` and `/faq` pages in both `?lng=ar` and `?lng=en` → confirm the edited text appears, correctly localized, with no deploy in between.

## 6. Admin account management (User Story 6)

Via `/admin/accounts`: invite a second Admin → confirm the invite email is received (check the configured SMTP sandbox inbox) and the new Admin can set a password and log in → suspend then reactivate that second Admin → attempt to suspend the *only remaining* active Admin and confirm it is blocked with a clear message (FR-037).

## 7. Background jobs (User Story 7)

```
curl -s http://localhost:4000/api/v1/admin/job-runs -H "Authorization: Bearer <admin-token>"
```
**Expected**: after ~15 minutes of the API running, all three jobs have at least one `SUCCESS` `JobRun` row. To verify locking, trigger two overlapping invocations manually in a test and confirm one is `SKIPPED_LOCKED` (covered by `jobs.test.ts`).

## 8. Real notification delivery (User Story 8)

Confirm a booking (any existing flow) → check the configured email/SMS sandbox for the confirmation message → stop the SMTP/SMS sandbox and repeat → confirm the booking action still succeeds and `GET /admin/reports/...` or `notificationsApi` shows a `FAILED` log entry with a reason, not a broken booking.

## 9. Object storage against a real provider (User Story 9)

```
docker run --rm -d --name pr-minio -p 9000:9000 -e MINIO_ROOT_USER=minio -e MINIO_ROOT_PASSWORD=minio12345 minio/minio server /data
```
Point `OBJECT_STORAGE_ENDPOINT`/`OBJECT_STORAGE_BUCKET`/credentials at this MinIO instance, upload a catalog image via the Admin UI, and confirm it renders on the public service-detail page.

## 10. Customer reschedule request (User Story 10)

As a customer with a confirmed upcoming booking: submit a reschedule request from `BookingDetail.tsx` → log in as Admin, see it in `/admin/reschedule-requests` → approve one test request (confirm the booking's schedule updates and slot capacity adjusts) and reject a second test request (confirm the original schedule is unchanged) → confirm both appear in the audit log (`/admin/reports/audit-log`).

## 11. Deployment, CI, ops (User Story 11)

```
docker compose up --build
```
**Expected**: `api`, `web`, and `postgres` all come up healthy; `curl http://localhost:<web-port>` serves prerendered HTML for `/`. Push a branch with a deliberately failing test and confirm `.github/workflows/ci.yml` blocks it. Perform one documented backup (`docs/backup-restore.md`) and restore it into a scratch database; perform one documented rollback (`docs/rollback.md`) by redeploying the previous image tag.

## 12. Final production acceptance (User Story 12)

Run, against the `docker compose` environment from step 11:
```
npm run lighthouse:ci
npx playwright test tests/e2e/accessibility.spec.ts
```
Manually verify at 360px viewport width, in both `ar` and `en`, on the flows exercised in steps 4–10 above. Confirm `docs/deployment.md`, `docs/backup-restore.md`, and `docs/rollback.md` are complete, and that step 11's backup/rollback drill already succeeded once, before signing off launch readiness per FR-067–FR-075.
