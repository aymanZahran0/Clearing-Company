import pino from "pino";

// FR-078: phone numbers and exact addresses must never appear in general
// application logs. Redaction paths cover the request body/query shapes
// used across auth, addresses, and booking endpoints. Exported separately
// (not just inlined into the `logger` call) so tests/unit/logRedaction.test.ts
// can exercise this exact config against a capturable stream instead of
// duplicating it and risking drift.
export const redactConfig = {
  paths: [
    "req.body.phone",
    "req.body.phoneNormalized",
    "req.body.contactPhone",
    "req.body.billingContactPhone",
    "req.body.newCustomer.phone",
    "req.body.password",
    "req.body.newPassword",
    "req.body.street",
    "req.body.buildingNumber",
    "req.body.unitNumber",
    "req.body.landmark",
    "req.body.latitude",
    "req.body.longitude",
    "req.body.mapUrl",
    "req.headers.authorization",
    "req.headers.cookie",
  ],
  censor: "[REDACTED]",
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: redactConfig,
});
