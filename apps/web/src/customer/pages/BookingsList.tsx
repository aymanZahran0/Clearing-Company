import { List, Tag, Skeleton, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useListOwnBookingsQuery } from "../../api/bookingsApi";
import { formatCurrency, formatDate } from "../../lib/formatters";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  PENDING: "gold",
  CONFIRMED: "blue",
  RESCHEDULED: "purple",
  IN_PROGRESS: "processing",
  COMPLETED: "green",
  CANCELLED: "default",
  REJECTED: "red",
  COMPLAINT_OPENED: "volcano",
};

export default function BookingsList() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListOwnBookingsQuery();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.bookings")}</h1>
      {isLoading && <Skeleton active />}
      {!isLoading && data?.items.length === 0 && <Empty />}
      <List
        dataSource={data?.items}
        renderItem={(booking) => (
          <List.Item>
            <Link to={`/bookings/${booking.id}`} className="flex w-full items-center justify-between">
              <span>
                <strong>{booking.referenceNumber}</strong>
                <br />
                <span className="text-sm text-gray-500">
                  {formatDate(booking.createdAt, i18n.language)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {booking.totalSnapshot != null && formatCurrency(booking.totalSnapshot, i18n.language)}
                <Tag color={STATUS_COLORS[booking.status]}>{booking.status}</Tag>
              </span>
            </Link>
          </List.Item>
        )}
      />
    </div>
  );
}
