# Nuqaa Asir — Cleaning Booking & Operations Platform

A two-role (Customer / Admin) booking and operations platform for a cleaning company serving Abha and Khamis Mushait. Customers browse services, get an instant-or-reviewed quote, book, track status, pay offline, and leave reviews/complaints. Admin confirms/prices/schedules/executes bookings, runs the quality checklist, manages subscriptions and commercial accounts, and reviews reports.

Full requirements, design, and task history live under [`specs/001-cleaning-company-platform/`](specs/001-cleaning-company-platform/):

- [`spec.md`](specs/001-cleaning-company-platform/spec.md) — business requirements
- [`plan.md`](specs/001-cleaning-company-platform/plan.md) — architecture and tech stack
- [`data-model.md`](specs/001-cleaning-company-platform/data-model.md) — entities, fields, relationships
- [`contracts/openapi.yaml`](specs/001-cleaning-company-platform/contracts/openapi.yaml) — REST API contract
- [`quickstart.md`](specs/001-cleaning-company-platform/quickstart.md) — end-to-end validation scenarios (V1–V10)
- [`tasks.md`](specs/001-cleaning-company-platform/tasks.md) — full implementation task log, including every deviation from the original design

## Stack

- **`apps/web`** — React 18 + Vite 5 + TypeScript, Redux Toolkit/RTK Query, Ant Design, Tailwind CSS, react-i18next (Arabic default, RTL-aware)
- **`apps/api`** — Express 4 + Prisma ORM + TypeScript, Zod validation, JWT auth, `pino` structured logging
- **`packages/shared`** — Zod schemas and TypeScript types shared between `apps/web` and `apps/api`, so client and server validation can't drift
- **Database** — PostgreSQL 16+
- **Package manager** — npm workspaces (not pnpm — see `research.md` R1: `corepack enable` failed with `EPERM` during initial setup)

## Repository Layout

```text
apps/web        # Customer Portal + Admin Dashboard (React + Vite)
apps/api        # REST API (Express + Prisma)
packages/shared # Zod schemas, shared TS types
tests/e2e       # Playwright end-to-end specs (span both apps)
specs/          # Spec-driven design artifacts (spec/plan/data-model/tasks)
```

## Setup

```bash
npm install
```

Create `.env` files from the examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Fill in `apps/api/.env`'s `DATABASE_URL` with a real PostgreSQL connection string, then:

```bash
npm run prisma:migrate --workspace apps/api   # applies the schema
npm run prisma:seed --workspace apps/api      # seeds catalog, areas, checklist templates, sample bookings
```

## Running Locally

```bash
npm run dev:api    # API on :4000
npm run dev:web     # Web on :5173
```

## Scripts (repo root)

| Script | What it does |
|---|---|
| `npm run build` | Builds `packages/shared`, then `apps/api`, then `apps/web` |
| `npm test` | Runs unit tests for `apps/web` and `apps/api` (no database required) |
| `npm run test:e2e` | Runs the Playwright E2E suite (`tests/e2e/`) — requires both apps running against a live, seeded PostgreSQL database |
| `npm run lint` | Lints `apps/web` and `apps/api` |
| `npm run typecheck` | Type-checks all three workspaces |
| `npm run lighthouse:ci` | Runs Lighthouse CI against the built public routes (Principle V thresholds — see `lighthouserc.json`) |

Per-workspace integration tests (`apps/api/tests/integration/`, requiring a live PostgreSQL test database) run via `npm run test:integration --workspace apps/api`.

## Deployment Overview

- **`apps/api`**: builds to `apps/api/dist`, runs as a standalone Node.js process (`node dist/server.js`) against one PostgreSQL database. No microservices, no message broker.
- **`apps/web`**: builds to `apps/web/dist` as a static SPA bundle, served by any static host/CDN in front of the API.
- No online payment gateway exists anywhere in this codebase by design (payments are Admin-recorded only — FR-064). No automatic data-deletion/retention job exists by design (FR-081) — both are enforced by a static check in `apps/api/tests/unit/staticChecks.test.ts`.

## Current Status

All 8 user stories (`spec.md`) and the Polish phase are implemented — see [`tasks.md`](specs/001-cleaning-company-platform/tasks.md) for the authoritative, per-task record of what's done, what's a documented deviation from the original design, and what remains a known follow-up (accessibility/Lighthouse tooling installation, live-database verification, i18n string extraction for Admin screens, and reconciling the project constitution with the final two-role Vite/Express stack).
