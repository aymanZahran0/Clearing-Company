import { test, expect } from "@playwright/test";

// Implements US5 (Admin customer account management). Requires both apps
// running + a live PostgreSQL database with a seeded Admin account.
test.describe("Admin customer account management (User Story 5)", () => {
  test("list/search -> suspend -> blocked login -> reactivate -> new login succeeds", async ({
    page,
    request,
  }) => {
    const suffix = Date.now();
    const phone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
    const fullName = `Managed Customer ${suffix}`;

    // Register the target customer directly via API (faster/less flaky
    // than driving the registration form for test setup).
    const registerRes = await request.post("http://localhost:4000/api/v1/auth/register", {
      data: { fullName, phone, password: "correct-horse-battery" },
    });
    expect(registerRes.ok()).toBe(true);

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    // List/search.
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: "إدارة العملاء" })).toBeVisible();
    await page.getByPlaceholder(/بحث بالاسم أو الجوال أو البريد الإلكتروني/).fill(fullName);
    await page.keyboard.press("Enter");
    await expect(page.locator("tr", { hasText: fullName })).toBeVisible();

    // Suspend with a reason.
    const row = page.locator("tr", { hasText: fullName });
    await row.getByRole("button", { name: "إيقاف" }).click();
    await page.getByLabel("سبب الإيقاف").fill("توقف عن السداد المتكرر");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "إيقاف" })
      .click();
    await expect(page.getByText("تم إيقاف حساب العميل")).toBeVisible();
    await expect(row.getByText("موقوف")).toBeVisible();

    // Blocked login for the suspended customer.
    const blockedLogin = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { identifier: phone, password: "correct-horse-battery" },
    });
    expect(blockedLogin.status()).toBe(401);
    const blockedBody = await blockedLogin.json();
    expect(blockedBody.error.code).toBe("ACCOUNT_SUSPENDED");

    // The row's action button is now Reactivate, not Suspend — the UI
    // structurally prevents a same-session double-suspend click. The
    // 409-conflict path (two Admins racing) is covered at the API layer by
    // apps/api/tests/integration/customerAccountStatus.test.ts.

    // Reactivate.
    await row.getByRole("button", { name: "إعادة تفعيل" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "إعادة تفعيل" })
      .click();
    await expect(page.getByText("تمت إعادة تفعيل حساب العميل")).toBeVisible();
    await expect(row.getByText("نشط")).toBeVisible();

    // New login succeeds after reactivation.
    const newLogin = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { identifier: phone, password: "correct-horse-battery" },
    });
    expect(newLogin.ok()).toBe(true);
  });

  test("Customer Detail page shows profile summary, addresses, and recent bookings", async ({ page, request }) => {
    const suffix = Date.now();
    const phone = `05${Math.floor(10000000 + Math.random() * 89999999)}`;
    const fullName = `Detail Customer ${suffix}`;
    await request.post("http://localhost:4000/api/v1/auth/register", {
      data: { fullName, phone, password: "correct-horse-battery" },
    });

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto("/admin/customers");
    await page.getByPlaceholder(/بحث بالاسم أو الجوال أو البريد الإلكتروني/).fill(fullName);
    await page.keyboard.press("Enter");
    await page.getByRole("link", { name: fullName }).click();

    await expect(page).toHaveURL(/\/admin\/customers\/[^/]+$/);
    await expect(page.getByRole("heading", { name: fullName })).toBeVisible();
    await expect(page.getByText("ملخص الملف الشخصي")).toBeVisible();
    await expect(page.getByText("العناوين")).toBeVisible();
    await expect(page.getByText("الحجوزات الأخيرة")).toBeVisible();
  });
});
