import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell, AdminShell } from "../components/layout/AppShell";
import { RequireAuth } from "../guards/RequireAuth";
import { RequireRole } from "../guards/RequireRole";
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

// Public routes (Home, ServiceCatalog, ServiceDetail) are the ones
// prerendered at build time per research.md R9 — see vite.config.ts (T079).
// Customer/Admin routes below stay CSR since they require authentication.
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppShell>
        <Home />
      </AppShell>
    ),
  },
  {
    path: "/services",
    element: (
      <AppShell>
        <ServiceCatalog />
      </AppShell>
    ),
  },
  {
    path: "/faq",
    element: (
      <AppShell>
        <Faq />
      </AppShell>
    ),
  },
  {
    path: "/service-areas",
    element: (
      <AppShell>
        <ServiceAreas />
      </AppShell>
    ),
  },
  {
    path: "/services/:slug",
    element: (
      <AppShell>
        <ServiceDetail />
      </AppShell>
    ),
  },
  {
    path: "/track",
    element: (
      <AppShell>
        <PublicBookingLookup />
      </AppShell>
    ),
  },
  {
    path: "/login",
    element: (
      <AppShell>
        <Login />
      </AppShell>
    ),
  },
  {
    path: "/register",
    element: (
      <AppShell>
        <Register />
      </AppShell>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <AppShell>
        <ForgotPassword />
      </AppShell>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <AppShell>
        <ResetPassword />
      </AppShell>
    ),
  },
  {
    path: "/booking/new",
    element: (
      <RequireAuth>
        <AppShell>
          <BookingWizard />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/bookings",
    element: (
      <RequireAuth>
        <AppShell>
          <BookingsList />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/bookings/:id",
    element: (
      <RequireAuth>
        <AppShell>
          <BookingDetail />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/profile",
    element: (
      <RequireAuth>
        <AppShell>
          <Profile />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/addresses",
    element: (
      <RequireAuth>
        <AppShell>
          <Addresses />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/invoices",
    element: (
      <RequireAuth>
        <AppShell>
          <InvoicesAndPayments />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/bookings/:id/review",
    element: (
      <RequireAuth>
        <AppShell>
          <ReviewForm />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/bookings/:id/complaint",
    element: (
      <RequireAuth>
        <AppShell>
          <ComplaintForm />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/subscriptions",
    element: (
      <RequireAuth>
        <AppShell>
          <Subscriptions />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/notifications",
    element: (
      <RequireAuth>
        <AppShell>
          <CustomerNotifications />
        </AppShell>
      </RequireAuth>
    ),
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
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
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <Services />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/catalog/add-ons",
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
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <AdminAccountsList />
        </AdminShell>
      </RequireRole>
    ),
  },
  {
    path: "/admin/pricing/discount-codes",
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
    element: (
      <RequireRole role="ADMIN">
        <AdminShell>
          <NotificationLog />
        </AdminShell>
      </RequireRole>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
