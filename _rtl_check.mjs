import { chromium } from "playwright";
const browser = await chromium.launch();

async function shot(url, locale, filename, loginAs) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/");
  if (locale === "en") {
    await page.evaluate(() => localStorage.setItem("i18nextLng", "en"));
  }
  if (loginAs === "admin") {
    await page.goto("http://localhost:5173/admin/login");
    await page.getByLabel(/رقم الجوال أو البريد|Mobile number or email/).fill("admin@nuqaa-asir.local");
    await page.getByLabel(/كلمة المرور|Password/).fill("ChangeMe123!");
    await page.getByRole("button", { name: /إرسال|Submit/ }).click();
    await page.waitForURL(/\/admin$/, { timeout: 10000 });
  }
  await page.goto(url);
  await page.waitForTimeout(700);
  await page.screenshot({ path: filename, fullPage: true });
  await context.close();
}

await shot("http://localhost:5173/admin", "ar", "_shot_admin_dashboard_ar.png", "admin");
await shot("http://localhost:5173/admin", "en", "_shot_admin_dashboard_en.png", "admin");
await shot("http://localhost:5173/", "ar", "_shot_home_ar.png", null);
await shot("http://localhost:5173/", "en", "_shot_home_en.png", null);
await browser.close();
console.log("done");
