import { test, expect } from "@playwright/test";

// Implements quickstart.md V4. Requires both apps running + a live
// PostgreSQL database with a CONFIRMED booking already present (e.g. from
// the booking-confirmation-and-pricing flow), a seeded Admin account, and a
// TimeSlot with capacity=1 already at capacity — not runnable in this
// sandbox. Selectors verified against
// apps/web/src/admin/pages/bookings/{List,Detail,ScheduleDialog}.tsx and
// apps/web/src/admin/pages/schedule/TimeSlots.tsx.
test.describe("Admin schedules a booking and hits time-slot capacity (User Story 4)", () => {
  test("schedules a confirmed booking with an internal note", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/bookings");
    await page.locator("tr", { hasText: "CONFIRMED" }).first().click();

    await page.getByRole("button", { name: "Schedule" }).click();
    await page.getByLabel("Time Slot").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Internal Handling Note (optional)").fill("Bring extra supplies");

    const scheduleResponse = page.waitForResponse(
      (res) => res.url().includes("/schedule") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Schedule", exact: true }).click();
    const response = await scheduleResponse;
    expect(response.status()).toBe(200);
  });

  test("blocks scheduling into a full time slot without an explicit override", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/bookings");
    await page.locator("tr", { hasText: "CONFIRMED" }).first().click();

    await page.getByRole("button", { name: "Schedule" }).click();
    // The full slot's option is rendered disabled by ScheduleDialog.tsx, so
    // the client-side control alone should prevent selecting it; this
    // asserts the option is disabled rather than attempting a submit that
    // the UI itself would block.
    await page.getByLabel("Time Slot").click();
    await expect(page.getByRole("option", { name: /1\/1/ })).toHaveAttribute("aria-disabled", "true");

    // With the override box checked, the same slot becomes selectable and
    // the server records a CAPACITY_OVERRIDE audit entry (verified in
    // apps/api/tests/integration/scheduling.test.ts).
    await page.getByRole("checkbox", { name: "Override capacity for a full slot" }).check();
  });
});
