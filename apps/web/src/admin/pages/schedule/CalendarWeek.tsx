import { useState } from "react";
import { Button, Card, Empty, Tag } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useListAllBookingsQuery } from "../../../api/bookingsApi";

// T113 (US4): 7-day scheduling overview, grouping CONFIRMED bookings by
// scheduled day so the Admin can spot gaps and overload at a glance.
export default function CalendarWeek() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week"));
  const scheduledFrom = weekStart.toISOString();
  const scheduledTo = weekStart.add(7, "day").toISOString();
  const { data, isLoading } = useListAllBookingsQuery({ scheduledFrom, scheduledTo });

  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:schedule.weekView")}</h1>
      <div className="mb-4 flex gap-2">
        <Button size="large" onClick={() => setWeekStart((prev) => prev.subtract(7, "day"))}>
          {t("admin:schedule.previous")}
        </Button>
        <Button size="large" onClick={() => setWeekStart((prev) => prev.add(7, "day"))}>
          {t("admin:schedule.next")}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const dayBookings = (data?.items ?? []).filter(
            (booking) =>
              booking.scheduledStartAt && dayjs(booking.scheduledStartAt).isSame(day, "day")
          );
          return (
            <Card key={day.toISOString()} size="small" title={day.format("ddd D MMM")} loading={isLoading}>
              {dayBookings.length === 0 ? (
                <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                    className="mb-2 cursor-pointer"
                  >
                    <div className="text-sm">{dayjs(booking.scheduledStartAt).format("HH:mm")}</div>
                    <div className="text-xs">{booking.referenceNumber}</div>
                    <Tag>{booking.status}</Tag>
                  </div>
                ))
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
