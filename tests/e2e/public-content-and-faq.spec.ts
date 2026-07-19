import { test, expect } from "@playwright/test";

// Implements US5 (public content/FAQ pages). Requires both apps running +
// a live PostgreSQL database with a seeded Admin account and the seeded
// "home-hero" WebsiteContentBlock (apps/api/prisma/seed.ts).
test.describe("Public content and FAQ reflect Admin edits (User Story 5)", () => {
  test("Admin edits the home-hero content block -> Home page reflects it in both locales, no redeploy", async ({
    page,
  }) => {
    const suffix = Date.now();
    const newTitleEn = `Updated Hero Title ${suffix}`;
    const newTitleAr = `عنوان محدث ${suffix}`;
    const newBodyEn = `Updated hero body ${suffix}`;
    const newBodyAr = `نص محدث ${suffix}`;

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto("/admin/content/website");
    await page.getByRole("button", { name: /New \/ Update Block|إضافة \/ تحديث عنصر/ }).click();
    await page.getByLabel(/^(Key|المفتاح)$/).fill("home-hero");
    await page.getByLabel(/^(Title \(Arabic\)|العنوان \(عربي\))$/).fill(newTitleAr);
    await page.getByLabel(/^(Title \(English\)|العنوان \(إنجليزي\))$/).fill(newTitleEn);
    await page.getByLabel(/^(Body \(Arabic\)|النص \(عربي\))$/).fill(newBodyAr);
    await page.getByLabel(/^(Body \(English\)|النص \(إنجليزي\))$/).fill(newBodyEn);
    // Type defaults to PAGE in the Select; home-hero is a SECTION, so it
    // must be re-selected or the upsert would flip its type. Options are
    // now localized (enumOptions), so match on either locale's label.
    await page.getByLabel(/^(Type|النوع)$/).click();
    await page.locator(".ant-select-item-option", { hasText: /^(Section|قسم)$/ }).click();

    const upsertResponse = page.waitForResponse(
      (res) => res.url().includes("/admin/content-blocks") && res.request().method() === "PUT"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Save|حفظ/ })
      .click();
    expect((await upsertResponse).status()).toBe(200);

    // Public Home page, Arabic (default locale) — no redeploy, just a
    // fresh navigation.
    await page.goto("/");
    await expect(page.getByText(newTitleAr)).toBeVisible();
    await expect(page.getByText(newBodyAr)).toBeVisible();

    // Same page, English. lib/i18n.ts's init() passes an explicit `lng`,
    // which bypasses the localStorage language-detector on initial load —
    // the only real way to switch locale is AppShell's runtime toggle
    // button (i18n.changeLanguage()), not a fresh navigation.
    await page.getByRole("button", { name: "Toggle language" }).click();
    await expect(page.getByText(newTitleEn)).toBeVisible();
    await expect(page.getByText(newBodyEn)).toBeVisible();
  });

  test("Admin adds a FAQ item -> /faq reflects it in both locales", async ({ page }) => {
    const suffix = Date.now();
    const questionEn = `Test Question ${suffix}?`;
    const questionAr = `سؤال اختباري ${suffix}؟`;
    const answerEn = `Test answer ${suffix}.`;
    const answerAr = `إجابة اختبارية ${suffix}.`;

    await page.goto("/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/);

    await page.goto("/admin/content/faqs");
    await page.getByRole("button", { name: /New FAQ|سؤال شائع جديد/ }).click();
    await page.getByLabel(/^(Question \(Arabic\)|السؤال \(عربي\))$/).fill(questionAr);
    await page.getByLabel(/^(Question \(English\)|السؤال \(إنجليزي\))$/).fill(questionEn);
    await page.getByLabel(/^(Answer \(Arabic\)|الإجابة \(عربي\))$/).fill(answerAr);
    await page.getByLabel(/^(Answer \(English\)|الإجابة \(إنجليزي\))$/).fill(answerEn);

    const createResponse = page.waitForResponse(
      (res) => res.url().includes("/admin/faqs") && res.request().method() === "POST"
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Add|إضافة/ })
      .click();
    expect((await createResponse).status()).toBe(201);

    await page.goto("/faq");
    await expect(page.getByText(questionAr)).toBeVisible();
    await page.getByText(questionAr).click();
    await expect(page.getByText(answerAr)).toBeVisible();

    // See the content-block test above for why this uses the runtime
    // toggle rather than a fresh navigation.
    await page.getByRole("button", { name: "Toggle language" }).click();
    await expect(page.getByText(questionEn)).toBeVisible();
  });
});
