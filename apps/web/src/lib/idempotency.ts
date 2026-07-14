// FR-013: prevents duplicate booking records from a double-click or
// network retry. A single key is generated when a form is first opened and
// reused for every retry of that same in-flight submission; a fresh key is
// only generated once the form is reset/reopened for a *new* submission.
const KEY_PREFIX = "idempotency:";

export function getOrCreateIdempotencyKey(formId: string): string {
  const storageKey = `${KEY_PREFIX}${formId}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, key);
  return key;
}

export function clearIdempotencyKey(formId: string): void {
  sessionStorage.removeItem(`${KEY_PREFIX}${formId}`);
}
