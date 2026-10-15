import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const siteUrl = "https://www.nuqaa-asir.com";
const outputDirectory = join(process.cwd(), "dist");
const template = await readFile(join(outputDirectory, "index.html"), "utf8");

const pages = [
  {
    path: "/",
    title: "نقاء عسير لخدمات التنظيف | أبها وخميس مشيط",
    description:
      "خدمات تنظيف منزلية وتجارية موثوقة في أبها وخميس مشيط. تنظيف منازل وشقق ومكاتب ومفروشات وخزانات، بفريق مدرب وحجز إلكتروني سهل.",
    heading: "نقاء عسير لخدمات التنظيف في أبها وخميس مشيط",
    body: "شركة تنظيف منزلية وتجارية في منطقة عسير تقدم تنظيف المنازل والشقق والفلل والمكاتب والمفروشات والخزانات وخدمات ما بعد البناء.",
  },
  {
    path: "/services",
    title: "خدمات التنظيف في أبها وخميس مشيط | نقاء عسير",
    description:
      "استعرض خدمات تنظيف المنازل والشقق والمكاتب والمفروشات والخزانات وما بعد البناء في أبها وخميس مشيط.",
    heading: "خدمات التنظيف في أبها وخميس مشيط",
    body: "نقدم تنظيف المنازل والشقق والفلل، وتنظيف المكاتب، والمفروشات بالبخار، وخزانات المياه، والتنظيف بعد البناء.",
  },
  {
    path: "/service-areas",
    title: "مناطق خدمة نقاء عسير | أبها وخميس مشيط",
    description:
      "تعرف على مناطق خدمة نقاء عسير ورسوم التنقل لخدمات التنظيف في أبها وخميس مشيط ومنطقة عسير.",
    heading: "مناطق خدمة نقاء عسير",
    body: "نقدم خدمات التنظيف في أبها وخميس مشيط ومناطق الخدمة المتاحة في منطقة عسير.",
  },
  {
    path: "/faq",
    title: "الأسئلة الشائعة عن خدمات التنظيف | نقاء عسير",
    description:
      "إجابات عن الحجز والأسعار والمواعيد وخدمات التنظيف التي تقدمها نقاء عسير في أبها وخميس مشيط.",
    heading: "الأسئلة الشائعة عن خدمات التنظيف",
    body: "تعرف على طريقة الحجز والأسعار والمواعيد ومناطق الخدمة وخدمات التنظيف المتاحة لدى نقاء عسير.",
  },
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render(page) {
  const canonical = `${siteUrl}${page.path === "/" ? "/" : page.path}`;
  const fallback = `<main lang="ar" dir="rtl"><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.body)}</p><nav aria-label="روابط الموقع"><a href="/">الرئيسية</a> <a href="/services">الخدمات</a> <a href="/service-areas">مناطق الخدمة</a> <a href="/faq">الأسئلة الشائعة</a></nav></main>`;

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(page.description)}" />`,
    )
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
}

for (const page of pages) {
  const outputPath =
    page.path === "/" ? join(outputDirectory, "index.html") : join(outputDirectory, page.path.slice(1), "index.html");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, render(page), "utf8");
}

console.log(`Generated crawlable HTML for ${pages.length} public routes.`);
