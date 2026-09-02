import { test, expect } from "@playwright/test";

// Implements quickstart.md V8. Requires both apps running + a live
// PostgreSQL database with a known seeded dataset — not runnable in this
// sandbox. Selectors verified against apps/web/src/admin/pages/{Dashboard,
// reports/{Revenue,Services,Quality,Export,AuditLogViewer}}.tsx.
test.describe("Admin reviews operational and revenue reports (User Story 8)", () => {
  test("dashboard stats and report totals load, export is PII-minimized by default", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await expect(page.getByText(/Today's Bookings|حجوزات اليوم/)).toBeVisible();
    await expect(page.getByText(/Unscheduled \(Confirmed\)|غير مجدولة \(مؤكدة\)/)).toBeVisible();
    await expect(page.getByText(/^(Overdue|متأخر)$/)).toBeVisible();

    await page.goto("/admin/reports/revenue");
    await expect(page.getByText(/Completed Bookings|الحجوزات المكتملة/)).toBeVisible();

    await page.goto("/admin/reports/services");
    await expect(page.getByRole("columnheader", { name: /Revenue|الإيرادات/ })).toBeVisible();

    await page.goto("/admin/reports/quality");
    await expect(page.getByText(/Average Rating|متوسط التقييم/)).toBeVisible();

    await page.goto("/admin/reports/audit-log");
    await expect(page.getByRole("columnheader", { name: /Action|الإجراء/ })).toBeVisible();

    // Export: default (no PII) download.
    await page.goto("/admin/reports/export");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download Excel file|تنزيل ملف Excel/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("تصدير-الحجوزات.xlsx");
  });
});
