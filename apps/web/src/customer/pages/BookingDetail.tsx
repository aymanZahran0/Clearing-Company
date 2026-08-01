import { Button, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useGetBookingQuery } from "../../api/bookingsApi";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/formatters";
import { CancelDialog } from "../../admin/pages/bookings/CancelDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { enumLabel } from "../../lib/enumLabels";
import { BOOKING_STATUS_META } from "../../lib/bookingStatusMeta";

// Bookings that can still be cancelled without a fee (FR-040); once
// execution has started or the booking has reached a terminal state, the
// action is hidden rather than sent to the server to fail.
const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED", "RESCHEDULED"];

export default function BookingDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useGetBookingQuery(id ?? "", {
    skip: !id,
    pollingInterval: 15_000,
    refetchOnFocus: true,
  });

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

  const bookingMeta = BOOKING_STATUS_META[booking.status];
  const serviceItem = booking.items?.find((item) => !item.addOnId);
  const serviceName = serviceItem?.service?.nameAr ?? null;
  const displayedStatusMeta = bookingMeta;
  const displayedStatusLabel = enumLabel("bookingStatus", booking.status);

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">{booking.referenceNumber}</h1>
            <div className="mt-1 text-sm text-muted">{formatDate(booking.createdAt, i18n.language)}</div>
          </div>
          <span className={`status-pill tone-${displayedStatusMeta.tone}`}>
            {displayedStatusLabel}
          </span>
        </div>

        {serviceName && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-white px-4 py-4">
            <div className="min-w-0">
              <div className="text-sm text-muted">{t("admin:bookings.service")}</div>
              <div className="mt-1 truncate font-bold text-ink">{serviceName}</div>
            </div>
            <span className={`list-card-icon tone-${displayedStatusMeta.tone}`} aria-hidden="true">
              {displayedStatusMeta.icon}
            </span>
          </div>
        )}

        <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <span className="text-sm text-muted">{t("admin:bookings.status")}</span>
            <span className={`status-pill tone-${displayedStatusMeta.tone}`}>
              {displayedStatusLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <span className="text-sm text-muted">{t("admin:bookings.scheduled")}</span>
            <span className="font-medium text-ink">
              {booking.scheduledStartAt ? formatDateTime(booking.scheduledStartAt, i18n.language) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <span className="text-sm text-muted">{t("admin:bookings.reference")}</span>
            <span className="font-medium text-ink">{booking.referenceNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <span className="text-sm text-muted">{t("admin:bookings.total")}</span>
            <span className="text-lg font-bold text-accent">
              {booking.totalSnapshot != null ? formatCurrency(booking.totalSnapshot, i18n.language) : "—"}
            </span>
          </div>
        </div>

        {CANCELLABLE_STATUSES.includes(booking.status) && (
          <div className="mt-6 flex flex-wrap gap-3">
            <CancelDialog
              bookingId={booking.id}
              onDone={refetch}
              triggerLabel={t("common.cancel") as string}
            />
            {booking.status === "CONFIRMED" &&
              booking.scheduledStartAt &&
              new Date(booking.scheduledStartAt) > new Date() && (
                <RescheduleDialog booking={booking} onDone={refetch} />
              )}
          </div>
        )}

        {(booking.status === "COMPLETED" || booking.status === "COMPLAINT_OPENED") && (
          <div className="mt-6 flex flex-wrap gap-3">
            {booking.status === "COMPLETED" && !booking.review && (
              <Link to={`/bookings/${booking.id}/review`}>
                <Button size="large">{t("customer:bookingDetail.rateThisService")}</Button>
              </Link>
            )}
            {!booking.qualityIssues?.length && (
              <Link to={`/bookings/${booking.id}/complaint`}>
                <Button size="large">{t("customer:bookingDetail.fileComplaint")}</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
