# Contract: Admin Account Management

New router: `apps/api/src/modules/admin-accounts/routes.ts`, mounted in `apps/api/src/app.ts`. All routes `authenticate` + `requireRole("ADMIN")`. Reuses the existing `User.status` enum (`ACTIVE|INVITED|SUSPENDED`) and `PasswordResetToken` model — no schema change (research.md R6, data-model.md §3).

## GET /admin/accounts

**Response**: `{ id, fullName, email, status, lastLoginAt, createdAt }[]` for every `User` where `role = ADMIN`.

## POST /admin/accounts/invite

**Body**: `{ fullName: string, email: string }`.

**Behavior**: 409 if a `User` with that email already exists (spec Edge Cases: reject duplicate invite, explain account already exists). Creates `User { role: ADMIN, status: INVITED, passwordHash: null }`, issues a `PasswordResetToken`, sends a "set your password" email via the R3 email adapter. Writes `AuditLog` (`action: "ADMIN_INVITED"`).

## POST /admin/accounts

**Body**: `{ fullName: string, email: string, password: string }`.

**Behavior**: Direct-creation fallback (FR-032) — creates `User { role: ADMIN, status: ACTIVE, passwordHash: bcrypt(password) }` immediately, no email dependency. Writes `AuditLog` (`action: "ADMIN_CREATED"`).

## POST /admin/accounts/:id/suspend

**Behavior**: 404 if not found or not an Admin. **409 if this is the last account with `role: ADMIN, status: ACTIVE`** (FR-037 — the core safety guarantee of this feature; checked via `countActiveAdmins()` in `apps/api/src/modules/admin-accounts/service.ts`, executed inside the same transaction as the status update to close the race between the check and the write). Otherwise sets `status = SUSPENDED`, revokes all outstanding refresh tokens for that user (bump `refreshTokenVersion`, consistent with existing revocation pattern used elsewhere in `auth/service.ts`). Writes `AuditLog` (`action: "ADMIN_SUSPENDED"`).

## POST /admin/accounts/:id/reactivate

**Behavior**: 404 if not found or not an Admin, or not currently `SUSPENDED`. Sets `status = ACTIVE`. Writes `AuditLog` (`action: "ADMIN_REACTIVATED"`).

## POST /admin/accounts/:id/reset-credential

**Behavior**: Admin-mediated reset of *another* Admin's credential (FR-035; distinct from the pre-existing self-service `forgotPassword` used for FR-036). Invalidates the target's current credential (clear `passwordHash`, bump `refreshTokenVersion`), issues a new `PasswordResetToken`, emails it. Writes `AuditLog` (`action: "ADMIN_CREDENTIAL_RESET"`).

## Reused, unchanged: self-service password reset (FR-036)

No new endpoint. `POST /auth/forgot-password` and `POST /auth/reset-password` already exist in `apps/api/src/modules/auth/{routes,service}.ts` and already work for any `User` row regardless of role. This feature adds only a UI entry point: an Admin-facing "Forgot password?" link on `apps/web/src/admin/pages/Login.tsx`, reusing the existing `apps/web/src/customer/pages/ForgotPassword.tsx`/`ResetPassword.tsx` flow's API calls (new thin Admin-styled pages, same RTK Query `authApi` endpoints).
