-- Remove operational modules that are no longer part of the two-role product.
DROP TABLE IF EXISTS "AuditLog";
DROP TABLE IF EXISTS "PricingRule";
DROP TABLE IF EXISTS "QualityIssue";
DROP TABLE IF EXISTS "JobRun";
DROP TABLE IF EXISTS "Contract";
DROP TABLE IF EXISTS "CommercialLocation";
DROP TABLE IF EXISTS "CommercialAccount";

ALTER TABLE "CustomerProfile"
  DROP COLUMN IF EXISTS "commercialAccountId";

DROP TYPE IF EXISTS "PricingRuleType";
DROP TYPE IF EXISTS "CalculationType";
DROP TYPE IF EXISTS "QualityIssueSource";
DROP TYPE IF EXISTS "QualityIssueSeverity";
DROP TYPE IF EXISTS "QualityIssueStatus";
DROP TYPE IF EXISTS "ContractStatus";
DROP TYPE IF EXISTS "JobName";
DROP TYPE IF EXISTS "JobRunStatus";
