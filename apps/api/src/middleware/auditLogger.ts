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

// Kept as a compatibility boundary for service calls. Audit persistence was
// intentionally removed from the simplified two-role product.
export async function recordAuditEntry(_input: RecordAuditEntryInput): Promise<void> {
  return Promise.resolve();
}
