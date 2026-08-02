import type { ComponentType, PropsWithChildren } from "react";
import { Layout, Menu, Drawer, Button, ConfigProvider, Dropdown } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DownOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ShareAltOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuOutlined,
  PhoneOutlined,
  PlusSquareOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  StopOutlined,
  SwapOutlined,
  SyncOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { clearAuth } from "../../features/auth/authSlice";
import { useLogoutMutation } from "../../api/authApi";
import { baseApi } from "../../api/baseApi";
import logo from "../../assets/logo/logo.png";
import { AppBreadcrumb } from "./AppBreadcrumb";
import { WhatsAppFloatingButton } from "./WhatsAppFloatingButton";
import { PublicFooter } from "../../customer/components/home/PublicFooter";

const { Header, Content, Sider } = Layout;

// The marketing footer belongs only to top-level destinations exposed in
// the customer navbar. Task/detail/auth flows stay focused and footer-free.
const PUBLIC_FOOTER_ROUTES = new Set([
  "/",
  "/services",
  "/service-areas",
  "/faq",
  "/bookings",
  "/subscriptions",
  "/notifications",
  "/invoices",
]);

/**
 * RTL-aware shell shared by all Customer Portal screens. Nav items collapse
 * into a Drawer below the `sm` breakpoint so the header never overflows on
 * a 360px viewport (constitution Principle II), and every interactive
 * element here is at least 44x44px via Ant Design's `size="large"`.
 */
export function AppShell({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [logout] = useLogoutMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const showPublicFooter = PUBLIC_FOOTER_ROUTES.has(location.pathname);

  // Keep the mobile navigation in sync with routing, including navigations
  // triggered outside the menu (breadcrumbs, redirects, or browser history).
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Data router navigations don't reset scroll position on their own, so
  // without this, opening a new page while scrolled down (e.g. tapping a
  // link near the bottom of a service detail page) lands mid-page instead
  // of at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  async function handleLogout() {
    await logout();
    dispatch(clearAuth());
    dispatch(baseApi.util.resetApiState());
    navigate("/");
  }

  function toggleLocale() {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "mobile-type-nav flex min-h-11 items-center rounded-md px-3 py-3 text-base transition-colors duration-200 sm:inline-flex",
      isActive
        ? "bg-[#E7F4F9] font-bold text-[#00375B]"
        : "text-[#006477] hover:bg-gray-50 hover:text-[#00375B]",
    ].join(" ");

  const accountMenu = user
    ? {
        items: [
          {
            key: "profile",
            icon: <UserOutlined />,
            label: t("nav.profile"),
            onClick: () => {
              setDrawerOpen(false);
              navigate("/profile");
            },
          },
          {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: t("nav.logout"),
            onClick: handleLogout,
          },
        ],
      }
    : undefined;

  const accountDropdown = user && accountMenu ? (
    <Dropdown menu={accountMenu} trigger={["click"]} placement="bottom">
      <Button
        type="text"
        size="large"
        className={`flex max-w-56 items-center gap-2 px-3 font-semibold ${
          location.pathname.startsWith("/profile")
            ? "bg-[#E7F4F9] text-[#00375B] hover:!bg-[#E7F4F9]"
            : "bg-gray-50 hover:!bg-gray-100"
        }`}
        aria-label={user.fullName}
      >
        <UserOutlined className="text-xl" />
        <span className="truncate">{user.fullName}</span>
        <DownOutlined className="text-xs" />
      </Button>
    </Dropdown>
  ) : null;

  // Shared page links, rendered in both the desktop header row and the
  // mobile Drawer. Auth actions (login/profile) are handled separately per
  // context: the desktop row appends them inline, while mobile surfaces
  // them as a compact button in the header itself (not buried in the
  // Drawer) — see `mobileAccountButton` below.
  const navItems = (
    <>
      <NavLink
        to="/"
        end
        className={navLinkClass}
        onClick={() => setDrawerOpen(false)}
      >
        {t("nav.home")}
      </NavLink>
      <NavLink
        to="/services"
        className={navLinkClass}
        onClick={() => setDrawerOpen(false)}
      >
        {t("nav.services")}
      </NavLink>
      <NavLink
        to="/service-areas"
        className={navLinkClass}
        onClick={() => setDrawerOpen(false)}
      >
        {t("nav.serviceAreas")}
      </NavLink>
      <NavLink
        to="/faq"
        className={navLinkClass}
        onClick={() => setDrawerOpen(false)}
      >
        {t("nav.faq")}
      </NavLink>
      {user?.role === "CUSTOMER" && (
        <>
          <NavLink
            to="/bookings"
            className={navLinkClass}
            onClick={() => setDrawerOpen(false)}
          >
            {t("nav.bookings")}
          </NavLink>
          <NavLink
            to="/subscriptions"
            className={navLinkClass}
            onClick={() => setDrawerOpen(false)}
          >
            {t("nav.mySubscriptions")}
          </NavLink>
          <NavLink
            to="/notifications"
            className={navLinkClass}
            onClick={() => setDrawerOpen(false)}
          >
            {t("nav.notifications")}
          </NavLink>
          <NavLink
            to="/invoices"
            className={navLinkClass}
            onClick={() => setDrawerOpen(false)}
          >
            {t("nav.invoices")}
          </NavLink>
        </>
      )}
    </>
  );

  // Desktop-only: login/register render inline in the nav row since there's
  // room; on mobile, login is a header button instead (see
  // `mobileAccountButton`), and register-only is kept in the Drawer so
  // sign-up is still reachable there.
  const desktopAuthLinks = !user ? (
    <>
      <NavLink to="/login" className={navLinkClass}>
        {t("nav.login")}
      </NavLink>
      <NavLink to="/register" className={navLinkClass}>
        {t("nav.register")}
      </NavLink>
    </>
  ) : null;

  const drawerAuthLinks = !user ? (
    <>
      <NavLink to="/login" className={navLinkClass} onClick={() => setDrawerOpen(false)}>
        {t("nav.login")}
      </NavLink>
      <NavLink to="/register" className={navLinkClass} onClick={() => setDrawerOpen(false)}>
        {t("nav.register")}
      </NavLink>
    </>
  ) : null;

  const mobileAccountButton = user && accountMenu ? (
    <Dropdown menu={accountMenu} trigger={["click"]} placement="bottom">
      <Button
        type="text"
        size="large"
        className={`mobile-type-nav flex max-w-32 items-center gap-2 px-3 font-semibold sm:hidden ${
          location.pathname.startsWith("/profile")
            ? "bg-[#E7F4F9] text-[#00375B] hover:!bg-[#E7F4F9]"
            : "bg-gray-50 hover:!bg-gray-100"
        }`}
        aria-label={user.fullName}
      >
        <UserOutlined className="text-xl" />
        <span className="truncate">{user.fullName}</span>
        <DownOutlined className="text-xs" />
      </Button>
    </Dropdown>
  ) : null;

  return (
    <Layout className="min-h-screen">
      <Header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-hairline bg-white px-4 shadow-sm">
        <Link to="/" className="flex min-h-11 items-center" aria-label={t("app.name") as string}>
          <span className="relative block h-16 w-32 overflow-hidden">
            <img src={logo} alt={t("app.name") as string} className="absolute start-1/2 top-[calc(50%+6px)] h-32 w-auto max-w-none -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
          </span>
        </Link>
        <div className="hidden items-center gap-4 sm:flex">
          {navItems}
          {desktopAuthLinks}
          {accountDropdown}
          <Button size="large" onClick={toggleLocale} aria-label="Toggle language">
            {i18n.language.startsWith("ar") ? "EN" : "AR"}
          </Button>
        </div>
        <div className="flex items-center gap-1 sm:hidden">
          {mobileAccountButton}
          <Button
            size="large"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.home") as string}
          />
        </div>
      </Header>
      <Drawer
        placement={i18n.language.startsWith("ar") ? "right" : "left"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={280}
      >
        <div className="flex flex-col">
          {navItems}
          {drawerAuthLinks}
          <Button size="large" className="mx-3 mt-3" onClick={toggleLocale}>
            {i18n.language.startsWith("ar") ? "English" : "العربية"}
          </Button>
        </div>
      </Drawer>
      <Content className="customer-site pt-20">
        <div className="app-breadcrumb-wrap app-breadcrumb-wrap--customer">
          <AppBreadcrumb />
        </div>
        <div
          className={`customer-page-content ${location.pathname === "/faq" ? "bg-white" : ""}`}
        >
          {children}
        </div>
        {showPublicFooter && <PublicFooter />}
      </Content>
      {!["/login", "/register"].includes(location.pathname) && <WhatsAppFloatingButton />}
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
const ADMIN_NAV_ITEMS: { key: string; labelKey: string; icon: ComponentType }[] = [
  { key: "/admin", labelKey: "admin:nav.dashboard", icon: DashboardOutlined },
  { key: "/admin/catalog/categories", labelKey: "admin:nav.catalogCategories", icon: AppstoreOutlined },
  { key: "/admin/catalog/services", labelKey: "admin:nav.catalogServices", icon: ToolOutlined },
  { key: "/admin/catalog/service-areas", labelKey: "admin:nav.catalogServiceAreas", icon: EnvironmentOutlined },
  { key: "/admin/catalog/add-ons", labelKey: "admin:nav.catalogAddOns", icon: PlusSquareOutlined },
  { key: "/admin/bookings", labelKey: "admin:nav.bookings", icon: CalendarOutlined },
  { key: "/admin/bookings/new", labelKey: "admin:nav.newPhoneBooking", icon: PhoneOutlined },
  { key: "/admin/schedule/week", labelKey: "admin:nav.scheduleWeek", icon: CalendarOutlined },
  { key: "/admin/schedule/day", labelKey: "admin:nav.scheduleDay", icon: FieldTimeOutlined },
  { key: "/admin/schedule/time-slots", labelKey: "admin:nav.timeSlots", icon: ClockCircleOutlined },
  { key: "/admin/schedule/operating-hours", labelKey: "admin:nav.operatingHours", icon: SettingOutlined },
  { key: "/admin/schedule/closed-dates", labelKey: "admin:nav.closedDates", icon: StopOutlined },
  { key: "/admin/quality/complaints", labelKey: "admin:nav.complaints", icon: WarningOutlined },
  { key: "/admin/subscriptions", labelKey: "admin:nav.subscriptions", icon: SyncOutlined },
  { key: "/admin/customers", labelKey: "admin:nav.customers", icon: TeamOutlined },
  { key: "/admin/reports/revenue", labelKey: "admin:nav.revenueReport", icon: LineChartOutlined },
  { key: "/admin/reports/services", labelKey: "admin:nav.servicesReport", icon: BarChartOutlined },
  { key: "/admin/reports/export", labelKey: "admin:nav.export", icon: ExportOutlined },
  { key: "/admin/reschedule-requests", labelKey: "admin:nav.rescheduleRequests", icon: SwapOutlined },
  { key: "/admin/content/website", labelKey: "admin:nav.websiteContent", icon: GlobalOutlined },
  { key: "/admin/content/faqs", labelKey: "admin:nav.faqs", icon: QuestionCircleOutlined },
  { key: "/admin/content/social-media", labelKey: "admin:nav.socialMedia", icon: ShareAltOutlined },
  { key: "/admin/settings", labelKey: "admin:nav.systemSettings", icon: SettingOutlined },
  { key: "/admin/pricing/discount-codes", labelKey: "admin:nav.discountCodes", icon: TagsOutlined },
  { key: "/admin/notifications/templates", labelKey: "admin:nav.notificationTemplates", icon: FileTextOutlined },
  { key: "/admin/notifications/log", labelKey: "admin:nav.notificationLog", icon: BellOutlined },
];

// Admin-only accent, scoped via a nested ConfigProvider below so it never
// bleeds into the customer AppShell's navy theme (DESIGN.md's brand
// palette stays customer-only; Admin gets its own teal-forward system
// per the reference dashboard the user asked to match).
const ADMIN_PRIMARY = "#0F766E";
const ADMIN_PRIMARY_HOVER = "#0B5D57";
const ADMIN_PRIMARY_TINT = "#E3F6F3";

export function AdminShell({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [logout] = useLogoutMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    dispatch(clearAuth());
    dispatch(baseApi.util.resetApiState());
    navigate("/admin/login");
  }

  function toggleLocale() {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  }

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      onClick={() => setDrawerOpen(false)}
      className="border-e-0 px-2 py-2"
      items={ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return {
          key: item.key,
          icon: <Icon />,
          label: <Link to={item.key}>{t(item.labelKey)}</Link>,
        };
      })}
    />
  );

  const accountMenu = {
    items: [
      {
        key: "logout",
        danger: true,
        icon: <LogoutOutlined />,
        label: t("nav.logout"),
        onClick: handleLogout,
      },
    ],
  };

  const accountButtonClass =
    "mobile-type-nav flex max-w-32 items-center gap-2 px-3 font-semibold sm:max-w-56 bg-gray-50 hover:!bg-gray-100";

  const accountDropdown = user ? (
    <Dropdown menu={accountMenu} trigger={["click"]} placement="bottom">
      <Button type="text" size="large" className={accountButtonClass} aria-label={user.fullName}>
        <UserOutlined className="text-xl" />
        <span className="truncate">{user.fullName}</span>
        <DownOutlined className="text-xs" />
      </Button>
    </Dropdown>
  ) : null;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: ADMIN_PRIMARY,
          colorLink: ADMIN_PRIMARY,
          colorLinkHover: ADMIN_PRIMARY_HOVER,
        },
        components: {
          Menu: {
            itemSelectedBg: ADMIN_PRIMARY_TINT,
            itemSelectedColor: ADMIN_PRIMARY,
            itemHoverBg: "#F1FAF9",
            itemHoverColor: ADMIN_PRIMARY,
            itemActiveBg: ADMIN_PRIMARY_TINT,
            itemBorderRadius: 10,
            itemMarginInline: 8,
            iconSize: 16,
          },
          Table: {
            headerBg: ADMIN_PRIMARY_TINT,
            headerColor: "#0B4A45",
            borderColor: "#EAF0EF",
            rowHoverBg: "#F1FAF9",
          },
          Switch: {
            colorPrimary: ADMIN_PRIMARY,
            colorPrimaryHover: ADMIN_PRIMARY_HOVER,
          },
          Pagination: {
            colorPrimary: ADMIN_PRIMARY,
            colorPrimaryHover: ADMIN_PRIMARY_HOVER,
          },
        },
      }}
    >
      <Layout className="h-[100dvh] overflow-hidden">
        <Header className="flex h-16 flex-none items-center justify-between bg-white px-4 shadow-sm">
          <span className="text-lg font-bold">{t("nav.adminDashboard")}</span>
          <div className="flex items-center gap-2">
            {accountDropdown}
            <Button size="large" onClick={toggleLocale} aria-label="Toggle language">
              {i18n.language.startsWith("ar") ? "EN" : "AR"}
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
        <Layout className="min-h-0 flex-1 bg-[#F5F8F8]">
          <Sider width={220} theme="light" className="hidden h-full overflow-y-auto border-e border-[#EAF0EF] lg:block">
            {menu}
          </Sider>
          <Drawer
            placement={i18n.language.startsWith("ar") ? "right" : "left"}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={260}
          >
            {menu}
          </Drawer>
          <Content className="h-full min-w-0 flex-1 overflow-y-auto">
            <div className="app-breadcrumb-wrap app-breadcrumb-wrap--admin">
              <AppBreadcrumb />
            </div>
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
