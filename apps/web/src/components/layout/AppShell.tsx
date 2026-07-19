import type { PropsWithChildren } from "react";
import { Layout, Menu, Drawer, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { clearAuth } from "../../features/auth/authSlice";
import { useLogoutMutation } from "../../api/authApi";
import { baseApi } from "../../api/baseApi";

const { Header, Content, Sider } = Layout;

/**
 * RTL-aware shell shared by all Customer Portal screens. Nav items collapse
 * into a Drawer below the `sm` breakpoint so the header never overflows on
 * a 360px viewport (constitution Principle II), and every interactive
 * element here is at least 44x44px via Ant Design's `size="large"`.
 */
export function AppShell({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [logout] = useLogoutMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    await logout();
    dispatch(clearAuth());
    dispatch(baseApi.util.resetApiState());
    navigate("/");
  }

  function toggleLocale() {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  }

  const navItems = (
    <>
      <Link
        to="/services"
        className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
      >
        {t("nav.services")}
      </Link>
      <Link
        to="/service-areas"
        className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
      >
        {t("nav.serviceAreas")}
      </Link>
      <Link
        to="/faq"
        className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
      >
        {t("nav.faq")}
      </Link>
      {user ? (
        <>
          <Link
            to="/bookings"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.bookings")}
          </Link>
          <Link
            to="/profile"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.profile")}
          </Link>
          <Link
            to="/subscriptions"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.mySubscriptions")}
          </Link>
          <Link
            to="/notifications"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.notifications")}
          </Link>
          <Link
            to="/invoices"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.invoices")}
          </Link>
          <button
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center px-3 py-3 text-start text-base sm:inline-flex sm:w-auto"
          >
            {t("nav.logout")}
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.login")}
          </Link>
          <Link
            to="/register"
            className="flex min-h-11 items-center px-3 py-3 text-base sm:inline-flex"
          >
            {t("nav.register")}
          </Link>
        </>
      )}
    </>
  );

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white px-4 shadow-sm">
        <Link to="/" className="flex min-h-11 items-center text-lg font-bold">
          {t("app.name")}
        </Link>
        <div className="hidden items-center gap-4 sm:flex">
          {navItems}
          <Button size="large" onClick={toggleLocale} aria-label="Toggle language">
            {i18n.language === "ar" ? "EN" : "AR"}
          </Button>
        </div>
        <Button
          className="sm:hidden"
          size="large"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
          aria-label={t("nav.home") as string}
        />
      </Header>
      <Drawer
        placement={i18n.language === "ar" ? "right" : "left"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={280}
      >
        <div className="flex flex-col">
          {navItems}
          <Button size="large" className="mx-3 mt-3" onClick={toggleLocale}>
            {i18n.language === "ar" ? "English" : "العربية"}
          </Button>
        </div>
      </Drawer>
      <Content>{children}</Content>
    </Layout>
  );
}

// Sections are added here as each Admin page ships (plan.md's admin route
// tree — catalog/pricing/schedule/subscriptions/commercial/payments/
// quality/notifications/content/settings/reports are added in their
// respective phases, not stubbed ahead of time per constitution "no
// half-finished implementations"). Labels are translation keys (US4
// scenario 1/FR-009) — the sidebar renders `t()` of each, not literal
// English text.
const ADMIN_NAV_ITEMS = [
  { key: "/admin", labelKey: "admin:nav.dashboard" },
  { key: "/admin/catalog/categories", labelKey: "admin:nav.catalogCategories" },
  { key: "/admin/catalog/services", labelKey: "admin:nav.catalogServices" },
  { key: "/admin/catalog/add-ons", labelKey: "admin:nav.catalogAddOns" },
  { key: "/admin/catalog/checklist", labelKey: "admin:nav.catalogChecklist" },
  { key: "/admin/bookings", labelKey: "admin:nav.bookings" },
  { key: "/admin/bookings/new", labelKey: "admin:nav.newPhoneBooking" },
  { key: "/admin/schedule/week", labelKey: "admin:nav.scheduleWeek" },
  { key: "/admin/schedule/day", labelKey: "admin:nav.scheduleDay" },
  { key: "/admin/schedule/time-slots", labelKey: "admin:nav.timeSlots" },
  { key: "/admin/schedule/operating-hours", labelKey: "admin:nav.operatingHours" },
  { key: "/admin/schedule/closed-dates", labelKey: "admin:nav.closedDates" },
  { key: "/admin/quality/reviews", labelKey: "admin:nav.reviews" },
  { key: "/admin/quality/complaints", labelKey: "admin:nav.complaints" },
  { key: "/admin/subscriptions", labelKey: "admin:nav.subscriptions" },
  { key: "/admin/commercial", labelKey: "admin:nav.commercialAccounts" },
  { key: "/admin/customers", labelKey: "admin:nav.customers" },
  { key: "/admin/reports/revenue", labelKey: "admin:nav.revenueReport" },
  { key: "/admin/reports/services", labelKey: "admin:nav.servicesReport" },
  { key: "/admin/reports/quality", labelKey: "admin:nav.qualityReport" },
  { key: "/admin/reports/export", labelKey: "admin:nav.export" },
  { key: "/admin/reports/audit-log", labelKey: "admin:nav.auditLog" },
  { key: "/admin/reports/job-runs", labelKey: "admin:nav.jobRuns" },
  { key: "/admin/reschedule-requests", labelKey: "admin:nav.rescheduleRequests" },
  { key: "/admin/content/website", labelKey: "admin:nav.websiteContent" },
  { key: "/admin/content/faqs", labelKey: "admin:nav.faqs" },
  { key: "/admin/settings", labelKey: "admin:nav.systemSettings" },
  { key: "/admin/accounts", labelKey: "admin:nav.adminAccounts" },
  { key: "/admin/pricing/discount-codes", labelKey: "admin:nav.discountCodes" },
  { key: "/admin/pricing/rules", labelKey: "admin:nav.pricingRules" },
  { key: "/admin/notifications/templates", labelKey: "admin:nav.notificationTemplates" },
  { key: "/admin/notifications/log", labelKey: "admin:nav.notificationLog" },
];

export function AdminShell({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    await logout();
    dispatch(clearAuth());
    dispatch(baseApi.util.resetApiState());
    navigate("/admin/login");
  }

  function toggleLocale() {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  }

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={[
        ...ADMIN_NAV_ITEMS.map((item) => ({
          key: item.key,
          label: <Link to={item.key}>{t(item.labelKey)}</Link>,
        })),
        { type: "divider" as const },
        { key: "logout", label: t("nav.logout"), onClick: handleLogout },
      ]}
    />
  );

  return (
    <Layout className="h-[100dvh] overflow-hidden">
      <Header className="flex h-16 flex-none items-center justify-between bg-white px-4 shadow-sm">
        <span className="text-lg font-bold">{t("nav.adminDashboard")}</span>
        <div className="flex items-center gap-2">
          <Button size="large" onClick={toggleLocale} aria-label="Toggle language">
            {i18n.language === "ar" ? "EN" : "AR"}
          </Button>
          <Button
            className="lg:hidden"
            size="large"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.adminDashboard") as string}
          />
        </div>
      </Header>
      {/* T042: sidebar and main content scroll completely independently —
          each is its own `h-full overflow-y-auto` container below the
          fixed-height header, instead of one page-level scrollbar. */}
      <Layout className="min-h-0 flex-1">
        <Sider width={220} theme="light" className="hidden h-full overflow-y-auto lg:block">
          {menu}
        </Sider>
        <Drawer
          placement={i18n.language === "ar" ? "right" : "left"}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
        >
          {menu}
        </Drawer>
        <Content className="h-full min-w-0 flex-1 overflow-y-auto">{children}</Content>
      </Layout>
    </Layout>
  );
}
