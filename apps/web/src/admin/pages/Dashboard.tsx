import { Button, Card, Col, Row, Statistic } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGetOperationsSummaryQuery } from "../../api/reportsApi";

// T164: finalized with real operations-summary stats (today's bookings,
// unscheduled confirmed, overdue).
export default function Dashboard() {
  const { t } = useTranslation();
  const { data: summary, isLoading: isSummaryLoading } = useGetOperationsSummaryQuery();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.adminDashboard")}</h1>

      <Row gutter={16} className="mb-4">
        <Col xs={24} sm={8}>
          <Card loading={isSummaryLoading}>
            <Statistic title={t("admin:dashboard.todaysBookings")} value={summary?.todaysBookings ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isSummaryLoading}>
            <Link to="/admin/bookings">
              <Statistic
                title={t("admin:dashboard.unscheduledConfirmed")}
                value={summary?.unscheduledConfirmed ?? 0}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isSummaryLoading}>
            <Statistic title={t("admin:dashboard.overdue")} value={summary?.overdueBookings ?? 0} />
          </Card>
        </Col>
      </Row>

      <Link to="/admin/bookings/new">
        <Button type="primary" size="large" className="mt-4">
          {t("admin:dashboard.newPhoneBooking")}
        </Button>
      </Link>
    </div>
  );
}
