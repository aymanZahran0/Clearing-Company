import { Button, List, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useListOccurrencesQuery, useSkipOccurrenceMutation } from "../../../api/subscriptionsApi";
import { formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";

// T153 (US7): lists generated occurrences for a subscription and lets the
// Admin skip a single future one without altering the subscription's own
// schedule (T158).
export function OccurrenceEditor({ subscriptionId }: { subscriptionId: string }) {
  const { t, i18n } = useTranslation();
  const { data: occurrences, isLoading } = useListOccurrencesQuery(subscriptionId);
  const [skipOccurrence] = useSkipOccurrenceMutation();
  const navigate = useNavigate();

  async function onSkip(occurrenceDate: string) {
    try {
      await skipOccurrence({ subscriptionId, occurrenceDate }).unwrap();
      message.success(t("admin:subscriptions.occurrenceSkipped"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-base font-medium">{t("admin:subscriptions.occurrences")}</h2>
      <List
        loading={isLoading}
        dataSource={occurrences}
        renderItem={(occurrence) => (
          <List.Item
            actions={[
              <Button key="view" size="small" onClick={() => navigate(`/admin/bookings/${occurrence.id}`)}>
                {t("admin:subscriptions.view")}
              </Button>,
              occurrence.status !== "CANCELLED" && occurrence.occurrenceDate ? (
                <Button key="skip" size="small" danger onClick={() => onSkip(occurrence.occurrenceDate!)}>
                  {t("admin:subscriptions.skip")}
                </Button>
              ) : null,
            ]}
          >
            {occurrence.occurrenceDate ? formatDateTime(occurrence.occurrenceDate, i18n.language) : "—"} —{" "}
            {occurrence.referenceNumber} <Tag>{enumLabel("bookingStatus", occurrence.status)}</Tag>
          </List.Item>
        )}
      />
    </div>
  );
}
