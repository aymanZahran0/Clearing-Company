-- A booking may have only one customer-originated quality issue, whether
-- created by a low rating or by the standalone complaint form.
-- Checklist failures remain unrestricted.
CREATE UNIQUE INDEX "QualityIssue_one_customer_issue_per_booking"
ON "QualityIssue" ("bookingId")
WHERE "source" IN ('REVIEW', 'COMPLAINT');
