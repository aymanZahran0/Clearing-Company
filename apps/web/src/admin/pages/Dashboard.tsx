import { Alert, Button, Card, Col, Row, Statistic } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGetQualityAlertsQuery } from "../../api/qualityIssuesApi";
import { useGetOperationsSummaryQuery } from "../../api/reportsApi";

// T164: finalized with real operations-summary stats (today's bookings,
// unscheduled confirmed, overdue).
export default function Dashboard() {
  const { t } = useTranslation();
  const { data: alerts } = useGetQualityAlertsQuery();
  const { data: summary, isLoading: isSummaryLoading } = useGetOperationsSummaryQuery();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.adminDashboard")}</h1>

      <Row gutter={16} className="mb-4">
        <Col xs={24} sm={8}>
          <Card loading={isSummaryLoading}>
            <Statistic title="Today's Bookings" value={summary?.todaysBookings ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isSummaryLoading}>
            <Link to="/admin/bookings">
              <Statistic title="Unscheduled (Confirmed)" value={summary?.unscheduledConfirmed ?? 0} />
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isSummaryLoading}>
            <Statistic title="Overdue" value={summary?.overdueBookings ?? 0} />
          </Card>
        </Col>
      </Row>

      {alerts && (alerts.lowRatingCount > 0 || alerts.agedOpenIssues > 0) && (
        <Alert
          className="mt-4"
          type="warning"
          showIcon
          message="Quality attention needed"
          description={
            <ul className="list-disc ps-4">
              {alerts.lowRatingCount > 0 && (
                <li>
                  <Link to="/admin/quality/reviews">{alerts.lowRatingCount} low-rating review(s)</Link> need
                  follow-up
                </li>
              )}
              {alerts.agedOpenIssues > 0 && (
                <li>
                  <Link to="/admin/quality/complaints">{alerts.agedOpenIssues} quality issue(s)</Link> open
                  for more than {alerts.agedThresholdDays} days
                </li>
              )}
            </ul>
          }
        />
      )}

      <Link to="/admin/bookings/new">
        <Button type="primary" size="large" className="mt-4">
          New Phone Booking
        </Button>
      </Link>
    </div>
  );
}
