import { test, expect } from "@playwright/test";
import { auditPageForViolations } from "./utils/arabicAudit";

// US4 scenario 6: crawls every registered public/customer/admin route in
// Arabic (the default locale) and fails on raw enum codes, known
// English-only labels, or incorrect dir/lang attributes. Requires both
// apps running + a live PostgreSQL database with the seeded Admin account
// and representative sample data (apps/api/prisma/seed.ts).

const PUBLIC_ROUTES = ["/", "/services", "/faq", "/service-areas", "/track", "/login", "/register", "/forgot-password", "/reset-password"];

const CUSTOMER_ROUTES = ["/bookings", "/profile", "/addresses", "/invoices", "/subscriptions", "/notifications"];

const ADMIN_ROUTES = [
  "/admin",
  "/admin/bookings",
  "/admin/bookings/new",
  "/admin/schedule/day",
  "/admin/schedule/week",
  "/admin/schedule/time-slots",
  "/admin/schedule/operating-hours",
  "/admin/schedule/closed-dates",
  "/admin/catalog/categories",
  "/admin/catalog/services",
  "/admin/catalog/add-ons",
  "/admin/catalog/checklist",
  "/admin/quality/reviews",
  "/admin/quality/complaints",
  "/admin/subscriptions",
  "/admin/subscriptions/new",
  "/admin/commercial",
  "/admin/reports/revenue",
  "/admin/reports/services",
  "/admin/reports/quality",
  "/admin/reports/export",
  "/admin/reports/audit-log",
  "/admin/reports/job-runs",
  "/admin/reschedule-requests",
  "/admin/customers",
  "/admin/content/website",
  "/admin/content/faqs",
  "/admin/settings",
  "/admin/accounts",
  "/admin/pricing/discount-codes",
  "/admin/pricing/rules",
  "/admin/notifications/templates",
  "/admin/notifications/log",
];

test.describe("Arabic-mode runtime route audit (User Story 4)", () => {
  test("public routes are free of raw enum codes and known English-only labels", async ({ page }) => {
    const failures: string[] = [];
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      const violations = await auditPageForViolations(page);
      if (violations.length > 0) {
        failures.push(`${route}: ${violations.map((v) => `[${v.type}] ${v.detail}`).join(", ")}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("customer routes are free of raw enum codes and known English-only labels", async ({ page }) => {
    const uniquePhone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
    await page.goto("/register");
    await page.getByLabel(/الاسم الكامل|Full Name/).fill("مدقق عربي");
    await page.getByLabel(/رقم الجوال|Mobile Number/).fill(uniquePhone);
    await page.getByLabel(/كلمة المرور|Password/).fill("correct-horse-battery");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await expect(page).toHaveURL(/\/bookings/);

    const failures: string[] = [];
    for (const route of CUSTOMER_ROUTES) {
      await page.goto(route);
      const violations = await auditPageForViolations(page);
      if (violations.length > 0) {
        failures.push(`${route}: ${violations.map((v) => `[${v.type}] ${v.detail}`).join(", ")}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("admin routes are free of raw enum codes and known English-only labels", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    const failures: string[] = [];
    for (const route of ADMIN_ROUTES) {
      await page.goto(route);
      const violations = await auditPageForViolations(page);
      if (violations.length > 0) {
        failures.push(`${route}: ${violations.map((v) => `[${v.type}] ${v.detail}`).join(", ")}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
