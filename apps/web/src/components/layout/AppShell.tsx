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
// half-finished implementations").
const ADMIN_NAV_ITEMS = [
  { key: "/admin", label: "Dashboard" },
  { key: "/admin/catalog/categories", label: "Catalog: Categories" },
  { key: "/admin/catalog/services", label: "Catalog: Services" },
  { key: "/admin/catalog/add-ons", label: "Catalog: Add-Ons" },
  { key: "/admin/catalog/checklist", label: "Catalog: Checklist" },
  { key: "/admin/bookings", label: "Bookings" },
  { key: "/admin/bookings/new", label: "New Phone Booking" },
  { key: "/admin/schedule/week", label: "Schedule (Week)" },
  { key: "/admin/schedule/day", label: "Schedule (Day)" },
  { key: "/admin/schedule/time-slots", label: "Time Slots" },
  { key: "/admin/schedule/operating-hours", label: "Operating Hours" },
  { key: "/admin/schedule/closed-dates", label: "Closed Dates" },
  { key: "/admin/quality/reviews", label: "Reviews" },
  { key: "/admin/quality/complaints", label: "Complaints" },
  { key: "/admin/subscriptions", label: "Subscriptions" },
  { key: "/admin/commercial", label: "Commercial Accounts" },
  { key: "/admin/reports/revenue", label: "Revenue Report" },
  { key: "/admin/reports/services", label: "Services Report" },
  { key: "/admin/reports/quality", label: "Quality Report" },
  { key: "/admin/reports/export", label: "Export" },
  { key: "/admin/reports/audit-log", label: "Audit Log" },
  { key: "/admin/reports/job-runs", label: "Job Runs" },
  { key: "/admin/reschedule-requests", label: "Reschedule Requests" },
  { key: "/admin/content/website", label: "Website Content" },
  { key: "/admin/content/faqs", label: "FAQs" },
  { key: "/admin/settings", label: "System Settings" },
  { key: "/admin/accounts", label: "Admin Accounts" },
  { key: "/admin/pricing/discount-codes", label: "Discount Codes" },
  { key: "/admin/pricing/rules", label: "Pricing Rules" },
  { key: "/admin/notifications/templates", label: "Notification Templates" },
  { key: "/admin/notifications/log", label: "Notification Log" },
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
    navigate("/admin/login");
  }

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={[
        ...ADMIN_NAV_ITEMS.map((item) => ({
          key: item.key,
          label: <Link to={item.key}>{item.label}</Link>,
        })),
        { type: "divider" as const },
        { key: "logout", label: t("nav.logout"), onClick: handleLogout },
      ]}
    />
  );

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white px-4 shadow-sm">
        <span className="text-lg font-bold">{t("nav.adminDashboard")}</span>
        <Button
          className="lg:hidden"
          size="large"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
          aria-label={t("nav.adminDashboard") as string}
        />
      </Header>
      <Layout>
        <Sider width={220} theme="light" className="hidden lg:block">
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
        <Content className="min-w-0 flex-1">{children}</Content>
      </Layout>
    </Layout>
  );
}
