import { Button, Descriptions, Skeleton, Tag, Timeline, message } from "antd";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  useCompleteBookingMutation,
  useGetBookingHistoryQuery,
  useGetBookingQuery,
  useMarkArrivedMutation,
  useMarkEnRouteMutation,
  useStartExecutionMutation,
} from "../../../api/bookingsApi";
import { formatCurrency, formatDateTime } from "../../../lib/formatters";
import { ConfirmDialog } from "./ConfirmDialog";
import { RejectDialog } from "./RejectDialog";
import { ScheduleDialog } from "./ScheduleDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { CancelDialog } from "./CancelDialog";
import { ChecklistRunner } from "./ChecklistRunner";
import { RecordPaymentDialog } from "../payments/RecordPaymentDialog";
import { PaymentsList } from "../payments/Invoices";

export default function BookingDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useGetBookingQuery(id ?? "", { skip: !id });
  const { data: history } = useGetBookingHistoryQuery(id ?? "", { skip: !id });
  const [markEnRoute, { isLoading: isMarkingEnRoute }] = useMarkEnRouteMutation();
  const [markArrived, { isLoading: isMarkingArrived }] = useMarkArrivedMutation();
  const [startExecution, { isLoading: isStarting }] = useStartExecutionMutation();
  const [completeBooking, { isLoading: isCompleting }] = useCompleteBookingMutation();

  async function runAction(action: () => Promise<unknown>, errorMessage: string) {
    try {
      await action();
      refetch();
    } catch {
      message.error(errorMessage);
    }
  }

  if (isLoading || !booking) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{booking.referenceNumber}</h1>

      <Descriptions column={1} bordered size="middle" className="mb-6">
        <Descriptions.Item label={t("admin:bookings.status")}>
          <Tag>{booking.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:bookings.total")}>
          {booking.totalSnapshot != null
            ? formatCurrency(booking.totalSnapshot, i18n.language)
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:bookings.scheduled")}>
          {booking.scheduledStartAt
            ? `${formatDateTime(booking.scheduledStartAt, i18n.language)} – ${formatDateTime(booking.scheduledEndAt ?? booking.scheduledStartAt, i18n.language)}`
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:bookings.internalHandlingNote")}>
          {booking.internalHandlingNote ?? "—"}
        </Descriptions.Item>
      </Descriptions>

      {booking.status === "PENDING" && (
        <div className="mb-6 flex flex-wrap gap-3">
          <ConfirmDialog bookingId={booking.id} onDone={refetch} />
          <RejectDialog bookingId={booking.id} onDone={refetch} />
        </div>
      )}

      {booking.status === "CONFIRMED" && (
        <div className="mb-6 flex flex-wrap gap-3">
          {booking.scheduledStartAt ? (
            <RescheduleDialog bookingId={booking.id} onDone={refetch} />
          ) : (
            <ScheduleDialog bookingId={booking.id} onDone={refetch} />
          )}
          <CancelDialog bookingId={booking.id} onDone={refetch} />
        </div>
      )}

      {(booking.status === "PENDING" || booking.status === "RESCHEDULED") && (
        <div className="mb-6 flex flex-wrap gap-3">
          <CancelDialog bookingId={booking.id} onDone={refetch} />
        </div>
      )}

      {booking.status === "CONFIRMED" && booking.scheduledStartAt && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            size="large"
            disabled={!!booking.enRouteAt}
            loading={isMarkingEnRoute}
            onClick={() => runAction(() => markEnRoute(booking.id).unwrap(), t("admin:bookings.enRouteError"))}
          >
            {t("admin:bookings.enRoute")}
          </Button>
          <Button
            size="large"
            disabled={!!booking.arrivedAt}
            loading={isMarkingArrived}
            onClick={() => runAction(() => markArrived(booking.id).unwrap(), t("admin:bookings.arrivedError"))}
          >
            {t("admin:bookings.arrived")}
          </Button>
          <Button
            type="primary"
            size="large"
            disabled={!booking.arrivedAt}
            loading={isStarting}
            onClick={() => runAction(() => startExecution(booking.id).unwrap(), t("admin:bookings.startError"))}
          >
            {t("admin:bookings.start")}
          </Button>
        </div>
      )}

      {booking.status === "IN_PROGRESS" && (
        <div className="mb-6">
          <h2 className="mb-2 text-base font-medium">{t("admin:bookings.qualityChecklist")}</h2>
          <ChecklistRunner bookingId={booking.id} />
          <Button
            type="primary"
            size="large"
            className="mt-4"
            loading={isCompleting}
            onClick={() =>
              runAction(() => completeBooking(booking.id).unwrap(), t("admin:bookings.completeError"))
            }
          >
            {t("admin:bookings.completeBooking")}
          </Button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-2 text-base font-medium">{t("nav.bookings")} — {t("admin:bookings.payments")}</h2>
        <RecordPaymentDialog bookingId={booking.id} />
        <div className="mt-3">
          <PaymentsList bookingId={booking.id} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-base font-medium">{t("admin:bookings.history")}</h2>
        <Timeline
          items={history?.map((entry) => ({
            children: `${entry.fromStatus ?? "—"} → ${entry.toStatus} (${formatDateTime(entry.createdAt, i18n.language)})${entry.reason ? `: ${entry.reason}` : ""}`,
          }))}
        />
      </div>
    </div>
  );
}
