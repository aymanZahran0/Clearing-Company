import { Button, Empty, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useListOwnBookingsQuery } from "../../api/bookingsApi";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { enumLabel } from "../../lib/enumLabels";
import { BOOKING_STATUS_META } from "../../lib/bookingStatusMeta";
import { QUALITY_ISSUE_STATUS_META } from "../../lib/qualityIssueStatusMeta";
import { ListCard } from "../../components/ListCard";

export default function BookingsList() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListOwnBookingsQuery(undefined, {
    pollingInterval: 15_000,
    refetchOnFocus: true,
  });
  const total = data?.total ?? data?.items.length ?? 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="list-page-header">
          <h1 className="text-xl font-semibold text-ink">{t("nav.bookings")}</h1>
          {!isLoading && data && data.items.length > 0 && (
            <span className="list-page-count">
              {t("customer:bookingsList.count", { count: total })}
            </span>
          )}
        </div>

        {isLoading && <Skeleton active />}

        {!isLoading && data?.items.length === 0 && (
          <Empty description={t("customer:bookingsList.emptyTitle")}>
            <Link to="/services">
              <Button type="primary" size="large">
                {t("customer:bookingsList.emptyCta")}
              </Button>
            </Link>
          </Empty>
        )}

        {!isLoading && data && data.items.length > 0 && (
          <div className="list-page-items">
            {data.items.map((booking) => {
              const complaint = booking.qualityIssues?.[0];
              const { tone, icon } = complaint
                ? QUALITY_ISSUE_STATUS_META[complaint.status]
                : BOOKING_STATUS_META[booking.status];
              return (
                <ListCard
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  tone={tone}
                  icon={icon}
                  title={booking.referenceNumber}
                  subtitle={formatDate(booking.createdAt, i18n.language)}
                  pill={
                    complaint
                      ? t(`customer:complaintStatus.${complaint.status}`)
                      : enumLabel("bookingStatus", booking.status)
                  }
                  value={
                    booking.totalSnapshot != null
                      ? formatCurrency(booking.totalSnapshot, i18n.language)
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
