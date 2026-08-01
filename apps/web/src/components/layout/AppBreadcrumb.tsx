import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

type Crumb = {
  label: string;
  to?: string;
};

const AR_LABELS: Record<string, string> = {
  services: "الخدمات",
  faq: "الأسئلة الشائعة",
  "service-areas": "مناطق الخدمة",
  track: "تتبّع الحجز",
  login: "تسجيل الدخول",
  register: "إنشاء حساب",
  "forgot-password": "نسيت كلمة المرور",
  "reset-password": "إعادة تعيين كلمة المرور",
  booking: "حجز خدمة",
  bookings: "الحجوزات",
  profile: "الملف الشخصي",
  addresses: "العناوين",
  invoices: "الفواتير والمدفوعات",
  review: "تقييم الخدمة",
  complaint: "تقديم شكوى",
  subscriptions: "الاشتراكات",
  notifications: "الإشعارات",
  admin: "لوحة التحكم",
  schedule: "الجدولة",
  day: "الجدول اليومي",
  week: "الجدول الأسبوعي",
  "time-slots": "الفترات الزمنية",
  "operating-hours": "ساعات العمل",
  "closed-dates": "أيام الإغلاق",
  catalog: "إدارة الكتالوج",
  categories: "التصنيفات",
  "add-ons": "الخدمات الإضافية",
  checklist: "قائمة التحقق",
  images: "صور الخدمة",
  quality: "الجودة",
  reviews: "التقييمات",
  commercial: "الحسابات التجارية",
  reports: "التقارير",
  revenue: "تقرير الإيرادات",
  export: "تصدير التقارير",
  "audit-log": "سجل التدقيق",
  "job-runs": "المهام المجدولة",
  "reschedule-requests": "طلبات تغيير الموعد",
  content: "إدارة المحتوى",
  website: "محتوى الموقع",
  faqs: "الأسئلة الشائعة",
  settings: "إعدادات النظام",
  accounts: "حسابات الإدارة",
  customers: "العملاء",
  pricing: "التسعير",
  "discount-codes": "أكواد الخصم",
  rules: "قواعد التسعير",
  templates: "قوالب الإشعارات",
  log: "سجل الإشعارات",
  new: "إضافة جديد",
};

const EN_LABELS: Record<string, string> = {
  services: "Services", faq: "FAQ", "service-areas": "Service areas", track: "Track booking",
  login: "Sign in", register: "Create account", "forgot-password": "Forgot password",
  "reset-password": "Reset password", booking: "Book a service", bookings: "Bookings",
  profile: "Profile", addresses: "Addresses", invoices: "Invoices & payments",
  review: "Service review", complaint: "Submit complaint", subscriptions: "Subscriptions",
  notifications: "Notifications", admin: "Dashboard", schedule: "Scheduling", day: "Daily calendar",
  week: "Weekly calendar", "time-slots": "Time slots", "operating-hours": "Operating hours",
  "closed-dates": "Closed dates", catalog: "Catalog", categories: "Categories", "add-ons": "Add-ons",
  checklist: "Checklist", images: "Service images", reports: "Reports", revenue: "Revenue report",
  export: "Export reports",
  "reschedule-requests": "Reschedule requests", content: "Content", website: "Website content",
  faqs: "FAQs", settings: "System settings", customers: "Customers",
  pricing: "Pricing", "discount-codes": "Discount codes",
  templates: "Notification templates", log: "Notification log", new: "Add new",
};

const LINKABLE_PATHS = new Set([
  "/",
  "/services",
  "/bookings",
  "/subscriptions",
  "/admin",
  "/admin/bookings",
  "/admin/catalog/categories",
  "/admin/catalog/services",
  "/admin/catalog/add-ons",
  "/admin/subscriptions",
  "/admin/customers",
]);

function isDynamicSegment(segment: string) {
  return /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment);
}

function buildCrumbs(pathname: string, isArabic: boolean): Crumb[] {
  const labels = isArabic ? AR_LABELS : EN_LABELS;
  const segments = pathname.split("/").filter(Boolean);
  const isAdmin = segments[0] === "admin";
  const homeLabel = isAdmin
    ? labels.admin ?? (isArabic ? "لوحة التحكم" : "Dashboard")
    : isArabic ? "الرئيسية" : "Home";

  if (segments.length === 0) return [{ label: homeLabel }];

  const crumbs: Crumb[] = [{ label: homeLabel, to: isAdmin ? "/admin" : "/" }];
  let path = "";

  segments.forEach((segment, index) => {
    path += `/${segment}`;
    if (isAdmin && index === 0) return;

    const isDynamic = isDynamicSegment(segment) || !labels[segment];
    const label = isDynamic
      ? (isArabic ? "التفاصيل" : "Details")
      : labels[segment] ?? (isArabic ? "الصفحة الحالية" : "Current page");

    crumbs.push({
      label,
      to: LINKABLE_PATHS.has(path) ? path : undefined,
    });
  });

  return crumbs;
}

function crumbTitle(crumb: Crumb, index: number, lastIndex: number): ReactNode {
  const content = index === 0 ? (
    <span className="app-breadcrumb-home">
      <HomeOutlined aria-hidden="true" />
      <span>{crumb.label}</span>
    </span>
  ) : crumb.label;

  return crumb.to && index !== lastIndex ? <Link to={crumb.to}>{content}</Link> : content;
}

export function AppBreadcrumb() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const isArabic = i18n.language.startsWith("ar");
  const crumbs = buildCrumbs(pathname, isArabic);

  return (
    <nav
      className="app-breadcrumb"
      aria-label={isArabic ? "مسار التنقل" : "Breadcrumb"}
    >
      <Breadcrumb
        separator={<span aria-hidden="true">/</span>}
        items={crumbs.map((crumb, index) => ({
          key: `${pathname}-${index}`,
          title: crumbTitle(crumb, index, crumbs.length - 1),
        }))}
      />
    </nav>
  );
}
