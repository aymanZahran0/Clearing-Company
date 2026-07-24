import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell, AdminShell } from "../components/layout/AppShell";
import NotFoundPage from "../pages/NotFoundPage";
import RouteErrorPage from "../pages/RouteErrorPage";
import { RequireRole } from "../guards/RequireRole";
import { RequireGuest } from "../guards/RequireGuest";
import Home from "../customer/pages/Home";
import ServiceCatalog from "../customer/pages/ServiceCatalog";
import ServiceDetail from "../customer/pages/ServiceDetail";
import Faq from "../customer/pages/Faq";
import ServiceAreas from "../customer/pages/ServiceAreas";
import Login from "../customer/pages/Login";
import Register from "../customer/pages/Register";
import ForgotPassword from "../customer/pages/ForgotPassword";
import ResetPassword from "../customer/pages/ResetPassword";
import BookingWizard from "../customer/pages/BookingWizard";
import BookingsList from "../customer/pages/BookingsList";
import BookingDetail from "../customer/pages/BookingDetail";
import Profile from "../customer/pages/Profile";
import Addresses from "../customer/pages/Addresses";
import InvoicesAndPayments from "../customer/pages/InvoicesAndPayments";
import PublicBookingLookup from "../customer/pages/PublicBookingLookup";
import ReviewForm from "../customer/pages/ReviewForm";
import ComplaintForm from "../customer/pages/ComplaintForm";
import Subscriptions from "../customer/pages/Subscriptions";
import CustomerNotifications from "../customer/pages/Notifications";
import AdminLogin from "../admin/pages/Login";
import AdminDashboard from "../admin/pages/Dashboard";
import NewPhoneBooking from "../admin/pages/bookings/NewPhoneBooking";
import AdminBookingsList from "../admin/pages/bookings/List";
import AdminBookingDetail from "../admin/pages/bookings/Detail";
import CalendarDay from "../admin/pages/schedule/CalendarDay";
import CalendarWeek from "../admin/pages/schedule/CalendarWeek";
import TimeSlots from "../admin/pages/schedule/TimeSlots";
import OperatingHours from "../admin/pages/schedule/OperatingHours";
import ClosedDates from "../admin/pages/schedule/ClosedDates";
import ChecklistTemplateEditor from "../admin/pages/catalog/ChecklistTemplateEditor";
import ServiceImages from "../admin/pages/catalog/ServiceImages";
import Categories from "../admin/pages/catalog/Categories";
import AdminServiceAreas from "../admin/pages/catalog/ServiceAreas";
import Services from "../admin/pages/catalog/Services";
import AddOns from "../admin/pages/catalog/AddOns";
import CatalogChecklist from "../admin/pages/catalog/CatalogChecklist";
import AdminReviews from "../admin/pages/quality/Reviews";
import AdminComplaints from "../admin/pages/quality/Complaints";
import AdminComplaintDetail from "../admin/pages/quality/ComplaintDetail";
import SubscriptionsList from "../admin/pages/subscriptions/List";
import SubscriptionEditor from "../admin/pages/subscriptions/Editor";
import CommercialAccounts from "../admin/pages/commercial/Accounts";
import CommercialContracts from "../admin/pages/commercial/Contracts";
import RevenueReport from "../admin/pages/reports/Revenue";
import ServicesReport from "../admin/pages/reports/Services";
import QualityReport from "../admin/pages/reports/Quality";
import ExportReport from "../admin/pages/reports/Export";
import AuditLogViewer from "../admin/pages/reports/AuditLogViewer";
import WebsiteContent from "../admin/pages/content/WebsiteContent";
import FAQs from "../admin/pages/content/FAQs";
import SystemSettings from "../admin/pages/settings/SystemSettings";
import DiscountCodes from "../admin/pages/pricing/DiscountCodes";
import PricingRules from "../admin/pages/pricing/PricingRules";
import NotificationTemplates from "../admin/pages/notifications/Templates";
import NotificationLog from "../admin/pages/notifications/Log";
import AdminAccountsList from "../admin/pages/accounts/List";
import JobRuns from "../admin/pages/reports/JobRuns";
import RescheduleRequestsList from "../admin/pages/reschedule-requests/List";
import AdminCustomersList from "../admin/pages/customers/List";
import AdminCustomerDetail from "../admin/pages/customers/Detail";

// Public routes (Home, ServiceCatalog, ServiceDetail) are the ones
// prerendered at build time per research.md R9 — see vite.config.ts (T079).
// Customer/Admin routes below stay CSR since they require authentication.
const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <Home />
      </AppShell>
    ),
  },
  {
    path: "/services",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <ServiceCatalog />
      </AppShell>
    ),
  },
  {
    path: "/faq",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <Faq />
      </AppShell>
    ),
  },
  {
    path: "/service-areas",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <ServiceAreas />
      </AppShell>
    ),
  },
  {
    path: "/services/:slug",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <ServiceDetail />
      </AppShell>
    ),
  },
  {
    path: "/track",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <PublicBookingLookup />
      </AppShell>
    ),
  },
  {
    path: "/login",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireGuest>
        <AppShell>
          <Login />
        </AppShell>
      </RequireGuest>
    ),
  },
  {
    path: "/register",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireGuest>
        <AppShell>
          <Register />
        </AppShell>
      </RequireGuest>
    ),
  },
  {
    path: "/forgot-password",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <ForgotPassword />
      </AppShell>
    ),
  },
  {
    path: "/reset-password",
    errorElement: <RouteErrorPage />,
    element: (
      <AppShell>
        <ResetPassword />
      </AppShell>
    ),
  },
  {
    path: "/booking/new",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <BookingWizard />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/bookings",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <BookingsList />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/bookings/:id",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <BookingDetail />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/profile",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <Profile />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/addresses",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <Addresses />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/invoices",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <InvoicesAndPayments />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/bookings/:id/review",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <ReviewForm />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/bookings/:id/complaint",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <ComplaintForm />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/subscriptions",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <Subscriptions />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/notifications",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="CUSTOMER">
        <AppShell>
          <CustomerNotifications />
        </AppShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/login",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireGuest authenticatedPath="/admin">
        <AdminLogin />
      </RequireGuest>
    ),
  },
  {
    path: "/admin",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminDashboard />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/bookings/new",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <NewPhoneBooking />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/bookings",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminBookingsList />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/bookings/:id",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminBookingDetail />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/schedule/day",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <CalendarDay />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/schedule/week",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <CalendarWeek />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/schedule/time-slots",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <TimeSlots />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/schedule/operating-hours",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <OperatingHours />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/schedule/closed-dates",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <ClosedDates />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/services/:serviceId/checklist",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <ChecklistTemplateEditor />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/categories",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <Categories />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/services",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <Services />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/service-areas",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminServiceAreas />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/add-ons",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AddOns />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/checklist",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <CatalogChecklist />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/services/:slug/images",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <ServiceImages />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/quality/reviews",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminReviews />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/quality/complaints",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminComplaints />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/quality/:id",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminComplaintDetail />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/subscriptions",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <SubscriptionsList />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/subscriptions/new",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <SubscriptionEditor />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/subscriptions/:id",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <SubscriptionEditor />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/commercial",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <CommercialAccounts />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/commercial/:id",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <CommercialContracts />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reports/revenue",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <RevenueReport />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reports/services",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <ServicesReport />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reports/quality",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <QualityReport />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reports/export",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <ExportReport />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reports/audit-log",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AuditLogViewer />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reports/job-runs",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <JobRuns />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/reschedule-requests",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <RescheduleRequestsList />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/content/website",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <WebsiteContent />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/content/faqs",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <FAQs />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/settings",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <SystemSettings />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/accounts",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminAccountsList />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/customers",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminCustomersList />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/customers/:id",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminCustomerDetail />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/pricing/discount-codes",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <DiscountCodes />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/pricing/rules",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <PricingRules />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/notifications/templates",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <NotificationTemplates />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/notifications/log",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <NotificationLog />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    // FR-003/US2: catch-all for any path that doesn't match a registered
    // route above. Must stay last in the array.
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
