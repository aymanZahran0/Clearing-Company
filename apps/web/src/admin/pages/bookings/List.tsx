import { useState } from "react";
import { Checkbox, Select, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useListAllBookingsQuery, type BookingStatus } from "../../../api/bookingsApi";
import { formatCurrency, formatDateTime } from "../../../lib/formatters";

const STATUSES: BookingStatus[] = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "RESCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "COMPLAINT_OPENED",
];

export default function BookingsList() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<BookingStatus | undefined>();
  const [needsScheduling, setNeedsScheduling] = useState(false);
  const { data, isLoading } = useListAllBookingsQuery({ status, needsScheduling: needsScheduling || undefined });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Bookings</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          allowClear
          placeholder="Filter by status"
          size="large"
          className="w-full sm:w-64"
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          onChange={setStatus}
        />
        <Checkbox checked={needsScheduling} onChange={(e) => setNeedsScheduling(e.target.checked)}>
          Needs scheduling
        </Checkbox>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        onRow={(booking) => ({ onClick: () => navigate(`/admin/bookings/${booking.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: "Reference", dataIndex: "referenceNumber" },
          {
            title: "Status",
            dataIndex: "status",
            render: (value: BookingStatus) => <Tag>{value}</Tag>,
          },
          {
            title: "Total",
            dataIndex: "totalSnapshot",
            render: (value: number | null) =>
              value != null ? formatCurrency(value, i18n.language) : "—",
          },
          {
            title: "Created",
            dataIndex: "createdAt",
            render: (value: string) => formatDateTime(value, i18n.language),
          },
        ]}
      />
    </div>
  );
}
