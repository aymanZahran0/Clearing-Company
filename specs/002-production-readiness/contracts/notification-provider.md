# Contract: Notification Provider Abstraction

Internal contract (no public HTTP surface) — mirrors the existing `apps/api/src/lib/storage/{index,factory,s3Adapter}.ts` pattern exactly (research.md R3/R4/R5).

## `apps/api/src/lib/notifications/index.ts`

```ts
export interface EmailAdapter {
  send(input: { to: string; subject: string; bodyHtml: string; bodyText?: string }): Promise<void>;
}
export interface SmsAdapter {
  send(input: { to: string; body: string }): Promise<void>;
}
```

## `apps/api/src/lib/notifications/factory.ts`

```ts
export function getEmailAdapter(): EmailAdapter   // throws 503 ApiError if EMAIL_SMTP_* env vars unset, same shape as storage factory
export function getSmsAdapter(): SmsAdapter       // throws 503 ApiError if SMS_PROVIDER_* env vars unset
```

Lazy singleton, exactly like `apps/api/src/lib/storage/factory.ts`'s `getStorageAdapter()` — so the API can boot without email/SMS configured (e.g. a fresh dev environment), only failing (loudly, via `notify()`'s catch — see below) when an actual send is attempted.

## `apps/api/src/modules/notifications/service.ts` — extended, not replaced

New function `notify(input)` added alongside the existing `listTemplates`/`upsertTemplate`/`listLogs`/`listLogsForCustomer`:

```ts
async function notify(input: {
  bookingId?: string;
  customerId?: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  templateKey: string;
  recipient: string;
  render: () => { subject?: string; body: string };
}): Promise<void> {
  const { subject, body } = input.render();
  try {
    if (input.channel === "EMAIL") await getEmailAdapter().send({ to: input.recipient, subject: subject ?? "", bodyHtml: body });
    if (input.channel === "SMS") await getSmsAdapter().send({ to: input.recipient, body });
    // WHATSAPP: unchanged manual click-to-chat log-write, no adapter call (FR-047)
    await prisma.notificationLog.create({ data: { ...input, status: "SENT" } });
  } catch (err) {
    await prisma.notificationLog.create({ data: { ...input, status: "FAILED", failureReason: String(err) } });
    // deliberately does not rethrow — FR-048
  }
}
```

**Callers to update** (no other logic in these files changes):
- `apps/api/src/modules/bookings/service.ts` (~line 163, ~line 642) — replace the direct `prisma.notificationLog.create({ ..., recipient: "" })` stub with a `notify(...)` call carrying the real customer email/phone.
- `apps/api/src/modules/admin-accounts/service.ts` (new, research.md R6) — invite/reset flows call `notify({ channel: "EMAIL", ... })`.
- `apps/api/src/modules/reschedule-requests/service.ts` (new, research.md R7) — approval/rejection call `notify({ channel: "EMAIL" | "SMS", ... })` depending on which contact method the customer has on file.

## Environment variables (new, all optional — API boots without them, `notify()` logs `FAILED` if a send is attempted and none are set)

| Variable | Purpose |
|---|---|
| `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`, `EMAIL_FROM_ADDRESS` | SMTP-based email adapter config (research.md R3) |
| `SMS_PROVIDER_API_KEY`, `SMS_PROVIDER_API_SECRET`, `SMS_FROM_NUMBER` | REST-based SMS adapter config (research.md R4) |

Documented in `apps/api/.env.example` alongside the existing `OBJECT_STORAGE_*` vars.
