import { test, expect } from "@playwright/test";

// Implements quickstart.md V6. Requires both apps running + a live
// PostgreSQL database with a COMPLETED booking already present (e.g. from
// the execution-and-checklist flow) — not runnable in this sandbox.
// Selectors verified against apps/web/src/customer/pages/{ReviewForm,
// ComplaintForm,BookingDetail}.tsx and
// apps/web/src/admin/pages/quality/{Complaints,ComplaintDetail,ReworkDialog}.tsx.
test.describe("Customer review, complaint, and Admin rework (User Story 6)", () => {
  test("a low rating auto-opens a quality issue the Admin can resolve with a rework booking", async ({
    page,
  }) => {
    // Customer leaves a low rating on their completed booking.
    await page.goto("/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("customer@example.com");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/bookings");
    await page.locator("tr", { hasText: "COMPLETED" }).first().click();
    await page.getByRole("link", { name: "Rate This Service" }).click();

    // Ant Design's Rate renders radio-like elements; select the lowest star.
    await page.locator(".ant-rate-star").first().click();
    const reviewResponse = page.waitForResponse(
      (res) => res.url().includes("/review") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Submit Review" }).click();
    await reviewResponse;

    // Admin sees the resulting quality issue and creates a rework booking.
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();

    await page.goto("/admin/quality/reviews");
    await page.locator("tr").nth(1).click();

    await page.getByRole("button", { name: "Create Rework Booking" }).click();
    const reworkResponse = page.waitForResponse(
      (res) => res.url().includes("/rework") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Create", exact: true }).click();
    const response = await reworkResponse;
    expect(response.status()).toBe(201);
  });
});
