import { Button, Descriptions, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useGetBookingQuery } from "../../api/bookingsApi";
import { formatCurrency, formatDateTime } from "../../lib/formatters";
import { CancelDialog } from "../../admin/pages/bookings/CancelDialog";

// Bookings that can still be cancelled without a fee (FR-040); once
// execution has started or the booking has reached a terminal state, the
// action is hidden rather than sent to the server to fail.
const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED", "RESCHEDULED"];

export default function BookingDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useGetBookingQuery(id ?? "", { skip: !id });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  if (!booking) {
    return <div className="p-4 sm:p-6">{t("common.error")}</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{booking.referenceNumber}</h1>
      <Descriptions column={1} bordered size="middle">
        <Descriptions.Item label="Status">
          <Tag>{booking.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Scheduled">
          {booking.scheduledStartAt
            ? formatDateTime(booking.scheduledStartAt, i18n.language)
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Total">
          {booking.totalSnapshot != null
            ? formatCurrency(booking.totalSnapshot, i18n.language)
            : "—"}
        </Descriptions.Item>
      </Descriptions>

      {CANCELLABLE_STATUSES.includes(booking.status) && (
        <div className="mt-6">
          <CancelDialog
            bookingId={booking.id}
            onDone={refetch}
            triggerLabel={t("common.cancel") as string}
          />
        </div>
      )}

      {(booking.status === "COMPLETED" || booking.status === "COMPLAINT_OPENED") && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/bookings/${booking.id}/review`}>
            <Button size="large">Rate This Service</Button>
          </Link>
          <Link to={`/bookings/${booking.id}/complaint`}>
            <Button size="large">File a Complaint</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
