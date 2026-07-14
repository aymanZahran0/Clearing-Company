import { Button, List, Tag, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useListOccurrencesQuery, useSkipOccurrenceMutation } from "../../../api/subscriptionsApi";
import { formatDateTime } from "../../../lib/formatters";

// T153 (US7): lists generated occurrences for a subscription and lets the
// Admin skip a single future one without altering the subscription's own
// schedule (T158).
export function OccurrenceEditor({ subscriptionId }: { subscriptionId: string }) {
  const { data: occurrences, isLoading } = useListOccurrencesQuery(subscriptionId);
  const [skipOccurrence] = useSkipOccurrenceMutation();
  const navigate = useNavigate();

  async function onSkip(occurrenceDate: string) {
    try {
      await skipOccurrence({ subscriptionId, occurrenceDate }).unwrap();
      message.success("Occurrence skipped");
    } catch {
      message.error("Could not skip this occurrence");
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-base font-medium">Occurrences</h2>
      <List
        loading={isLoading}
        dataSource={occurrences}
        renderItem={(occurrence) => (
          <List.Item
            actions={[
              <Button key="view" size="small" onClick={() => navigate(`/admin/bookings/${occurrence.id}`)}>
                View
              </Button>,
              occurrence.status !== "CANCELLED" && occurrence.occurrenceDate ? (
                <Button key="skip" size="small" danger onClick={() => onSkip(occurrence.occurrenceDate!)}>
                  Skip
                </Button>
              ) : null,
            ]}
          >
            {occurrence.occurrenceDate ? formatDateTime(occurrence.occurrenceDate, "en") : "—"} —{" "}
            {occurrence.referenceNumber} <Tag>{occurrence.status}</Tag>
          </List.Item>
        )}
      />
    </div>
  );
}
