import { test, expect } from "@playwright/test";

// Implements US6 (Admin manages other Admin accounts safely). Requires both
// apps running + a live PostgreSQL database with a seeded Admin account —
// not runnable in this sandbox. Selectors verified against
// apps/web/src/admin/pages/accounts/{List,InviteDialog,ResetDialog}.tsx.
test.describe("Admin manages other Admin accounts safely (User Story 6)", () => {
  test("invites a second Admin, suspends/reactivates an active Admin, and protects the last active Admin", async ({
    page,
    request,
  }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    // Invite flow: confirm the invited account shows as INVITED. It can't
    // be suspended/reactivated yet (only ACTIVE accounts can, enforced
    // server-side) — that flow is exercised separately below via a
    // directly-created (already ACTIVE) second Admin.
    await page.goto("/admin/accounts");
    const invitedEmail = `admin-e2e-invited-${Date.now()}@example.com`;
    await page.getByRole("button", { name: /Invite Admin|دعوة مسؤول/ }).click();
    await page.getByLabel(/^(Full Name|الاسم الكامل)$/).fill("Invited Admin");
    await page.getByLabel(/^(Email|البريد الإلكتروني)$/).fill(invitedEmail);
    const inviteResponse = page.waitForResponse(
      (res) => res.url().includes("/admin/accounts/invite") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Send Invite|إرسال الدعوة/ }).click();
    const inviteRes = await inviteResponse;
    expect(inviteRes.status()).toBe(201);
    await expect(page.locator("tr", { hasText: invitedEmail }).getByText("INVITED", { exact: true })).toBeVisible();

    // Set up a second ACTIVE Admin via the direct-creation endpoint for the
    // suspend/reactivate/last-active-Admin-protection flow.
    const adminLoginRes = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { identifier: "admin@nuqaa-asir.local", password: "ChangeMe123!" },
    });
    const { accessToken } = await adminLoginRes.json();
    const activeEmail = `admin-e2e-active-${Date.now()}@example.com`;
    await request.post("http://localhost:4000/api/v1/admin/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { fullName: "Active Second Admin", email: activeEmail, password: "correct-horse-battery" },
    });

    await page.reload();
    const row = page.locator("tr", { hasText: activeEmail });
    await expect(row.getByText("ACTIVE", { exact: true })).toBeVisible();

    // Ant Design's Popconfirm buttons carry no distinguishing accessible
    // name here, so target the (always-primary, rightmost) confirm button
    // by class.
    async function confirmPopconfirm() {
      await page.locator(".ant-popconfirm-buttons button").last().click();
    }

    const suspendResponse = page.waitForResponse(
      (res) => res.url().includes("/suspend") && res.request().method() === "POST"
    );
    await row.getByRole("button", { name: /Suspend|إيقاف/ }).click();
    await confirmPopconfirm();
    const suspendRes = await suspendResponse;
    expect(suspendRes.status()).toBe(200);
    await expect(row.getByText("SUSPENDED", { exact: true })).toBeVisible();

    const reactivateResponse = page.waitForResponse(
      (res) => res.url().includes("/reactivate") && res.request().method() === "POST"
    );
    await row.getByRole("button", { name: /Reactivate|إعادة تفعيل/ }).click();
    const reactivateRes = await reactivateResponse;
    expect(reactivateRes.status()).toBe(200);
    await expect(row.getByText("ACTIVE", { exact: true })).toBeVisible();

    // Suspending the sole remaining active Admin must be blocked (409).
    // Suspend the second admin again so the seeded admin becomes the last
    // active one, then attempt (and expect to fail) suspending it.
    const secondSuspend = page.waitForResponse(
      (res) => res.url().includes("/suspend") && res.request().method() === "POST"
    );
    await row.getByRole("button", { name: /Suspend|إيقاف/ }).click();
    await confirmPopconfirm();
    await secondSuspend;

    const seededRow = page.locator("tr", { hasText: "admin@nuqaa-asir.local" });
    const blockedResponse = page.waitForResponse(
      (res) => res.url().includes("/suspend") && res.request().method() === "POST"
    );
    await seededRow.getByRole("button", { name: /Suspend|إيقاف/ }).click();
    await confirmPopconfirm();
    const blockedRes = await blockedResponse;
    expect(blockedRes.status()).toBe(409);
    await expect(seededRow.getByText("ACTIVE", { exact: true })).toBeVisible();
  });
});
