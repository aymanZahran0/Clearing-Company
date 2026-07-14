import { useState } from "react";
import { DatePicker, Empty, List, Tag } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useListAllBookingsQuery } from "../../../api/bookingsApi";
import { formatDateTime } from "../../../lib/formatters";

// T113 (US4): a single day's scheduled bookings, including internal notes.
export default function CalendarDay() {
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs());
  const scheduledFrom = date.startOf("day").toISOString();
  const scheduledTo = date.endOf("day").toISOString();
  const { data, isLoading } = useListAllBookingsQuery({ scheduledFrom, scheduledTo });

  const scheduled = (data?.items ?? []).filter((booking) => booking.scheduledStartAt);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Day View</h1>
      <DatePicker size="large" value={date} onChange={(value) => value && setDate(value)} className="mb-4" />
      {!isLoading && scheduled.length === 0 && <Empty description="No bookings scheduled for this day" />}
      <List
        loading={isLoading}
        dataSource={scheduled}
        renderItem={(booking) => (
          <List.Item onClick={() => navigate(`/admin/bookings/${booking.id}`)} className="cursor-pointer">
            <div>
              <div className="font-medium">
                {formatDateTime(booking.scheduledStartAt!, "en")} — {booking.referenceNumber}
              </div>
              <Tag>{booking.status}</Tag>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
