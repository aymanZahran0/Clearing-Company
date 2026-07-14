import { prisma } from "../lib/prisma.js";

interface RecordAuditEntryInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * FR-004: writes an AuditLog row for a sensitive action. Called explicitly
 * from the relevant service function (price override, cancellation,
 * scheduling override, payment change, administrator account change, data
 * export) rather than inferred generically from the route, so the
 * before/after snapshot is always meaningful and PII-minimized (FR-078).
 * Takes plain values rather than an Express Request so service-layer code
 * doesn't need an HTTP framework dependency.
 */
export async function recordAuditEntry({
  actorUserId,
  action,
  entityType,
  entityId,
  beforeSnapshot,
  afterSnapshot,
  ipAddress,
  userAgent,
}: RecordAuditEntryInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      beforeSnapshotJson: beforeSnapshot === undefined ? undefined : (beforeSnapshot as object),
      afterSnapshotJson: afterSnapshot === undefined ? undefined : (afterSnapshot as object),
      ipAddress,
      userAgent,
    },
  });
}
