import { BarChartOutlined, CalendarOutlined, ClockCircleOutlined, PlusOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Skeleton } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGetOperationsSummaryQuery } from "../../api/reportsApi";
import type { BookingStatus } from "../../api/bookingsApi";
import { BOOKING_STATUS_META } from "../../lib/bookingStatusMeta";
import { enumLabel } from "../../lib/enumLabels";

type Metric = { key: string; label: string; value: number; color: string; tint: string; icon: ReactNode; href?: string };

const REQUEST_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED", "COMPLAINT_OPENED"];

function MetricCard({ metric, total }: { metric: Metric; total: number }) {
  const percentage = total ? Math.round((metric.value / total) * 100) : 0;
  const content = (
    <div className="admin-metric-card" style={{ "--metric-color": metric.color, "--metric-tint": metric.tint } as CSSProperties}>
      <div className="admin-metric-icon" aria-hidden="true">{metric.icon}</div>
      <div className="admin-metric-copy"><span>{metric.label}</span><strong>{metric.value.toLocaleString()}</strong><small>{percentage}%</small></div>
      <svg className="admin-metric-spark" viewBox="0 0 300 54" preserveAspectRatio="none" aria-hidden="true"><path d="M0 43C34 45 46 31 75 32C104 33 113 45 146 42C180 39 184 22 219 25C254 28 264 43 300 38V54H0Z" /></svg>
    </div>
  );
  return metric.href ? <Link className="admin-metric-link" to={metric.href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useGetOperationsSummaryQuery();
  const metrics: Metric[] = [
    { key: "today", label: t("admin:dashboard.todaysBookings"), value: summary?.todaysBookings ?? 0, color: "#00375B", tint: "#E7F4F9", icon: <CalendarOutlined /> },
    { key: "unscheduled", label: t("admin:dashboard.unscheduledConfirmed"), value: summary?.unscheduledConfirmed ?? 0, color: "#006477", tint: "#D5F1F6", icon: <ClockCircleOutlined />, href: "/admin/bookings" },
    { key: "overdue", label: t("admin:dashboard.overdue"), value: summary?.overdueBookings ?? 0, color: "#9A6700", tint: "#FFF7D6", icon: <WarningOutlined />, href: "/admin/bookings" },
  ];
  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);
  const max = Math.max(...metrics.map((metric) => metric.value), 1);
  let donutOffset = 0;

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div><h1>{t("nav.adminDashboard")}</h1><p>{t("admin:dashboard.subtitle")}</p></div>
        <Link to="/admin/bookings/new"><Button type="primary" size="large" icon={<PlusOutlined />}>{t("admin:dashboard.newPhoneBooking")}</Button></Link>
      </header>
      <section className="admin-welcome" aria-label={t("admin:dashboard.welcomeTitle")}>
        <div className="admin-welcome-icon"><BarChartOutlined /></div>
        <div><strong>{t("admin:dashboard.welcomeTitle")}</strong><span>{t("admin:dashboard.welcomeBody")}</span></div>
      </section>
      {isLoading ? <div className="admin-dashboard-loading" aria-label={t("admin:dashboard.loading")}><Skeleton active paragraph={{ rows: 8 }} /></div> : <>
        <section className="admin-metrics" aria-label={t("admin:dashboard.summaryLabel")}>{metrics.map((metric) => <MetricCard key={metric.key} metric={metric} total={total} />)}</section>
        <section className="admin-status-section" aria-labelledby="request-status-title">
          <div className="admin-panel-heading"><h2 id="request-status-title">{t("admin:dashboard.allRequestsTitle")}</h2><p>{t("admin:dashboard.allRequestsDescription")}</p></div>
          <div className="admin-status-grid">
            {REQUEST_STATUSES.map((status) => <Link className={`admin-status-card tone-${BOOKING_STATUS_META[status].tone}`} to={`/admin/bookings?status=${status}`} key={status}>
              <span className="admin-status-icon" aria-hidden="true">{BOOKING_STATUS_META[status].icon}</span>
              <span>{enumLabel("bookingStatus", status)}</span>
              <strong>{(summary?.statusCounts?.[status] ?? 0).toLocaleString()}</strong>
            </Link>)}
          </div>
        </section>
        <section className="admin-charts">
          <article className="admin-chart-panel">
            <div className="admin-panel-heading"><h2>{t("admin:dashboard.overviewTitle")}</h2><p>{t("admin:dashboard.overviewDescription")}</p></div>
            <div className="admin-bar-chart" role="img" aria-label={t("admin:dashboard.overviewAriaLabel")}>
              {metrics.map((metric) => <div className="admin-bar-row" key={metric.key}>
                <span className="admin-bar-label">{metric.label}</span><div className="admin-bar-track"><div className="admin-bar-fill" style={{ width: `${Math.max(metric.value ? 8 : 0, (metric.value / max) * 100)}%`, backgroundColor: metric.color }} /></div><strong>{metric.value.toLocaleString()}</strong>
              </div>)}
            </div>
          </article>
          <article className="admin-chart-panel">
            <div className="admin-panel-heading"><h2>{t("admin:dashboard.distributionTitle")}</h2><p>{t("admin:dashboard.distributionDescription")}</p></div>
            <div className="admin-donut-layout">
              <div className="admin-donut" role="img" aria-label={t("admin:dashboard.distributionAriaLabel", { total })}>
                <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="admin-donut-track" cx="60" cy="60" r="45" />{total > 0 && metrics.map((metric) => { const portion = (metric.value / total) * 100; const circle = <circle key={metric.key} cx="60" cy="60" r="45" fill="none" stroke={metric.color} strokeWidth="16" strokeDasharray={`${portion} ${100 - portion}`} strokeDashoffset={-donutOffset} pathLength="100" />; donutOffset += portion; return circle; })}</svg>
                <div><strong>{total.toLocaleString()}</strong><span>{t("admin:dashboard.totalBookings")}</span></div>
              </div>
              <ul className="admin-chart-legend">{metrics.map((metric) => <li key={metric.key}><i style={{ backgroundColor: metric.color }} /><span>{metric.label}</span><strong>{metric.value.toLocaleString()} ({total ? Math.round((metric.value / total) * 100) : 0}%)</strong></li>)}</ul>
            </div>
          </article>
        </section>
      </>}
    </main>
  );
}
