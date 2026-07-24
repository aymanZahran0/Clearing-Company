import { useState } from "react";
import { Button, Checkbox, Select, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useListAllBookingsQuery, type BookingStatus } from "../../../api/bookingsApi";
import { formatCurrency, formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<BookingStatus | undefined>();
  const [needsScheduling, setNeedsScheduling] = useState(false);
  const { data, isLoading } = useListAllBookingsQuery({ status, needsScheduling: needsScheduling || undefined });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:bookings.title")}</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            allowClear
            placeholder={t("admin:bookings.filterByStatus")}
            size="large"
            className="w-full sm:w-64"
            options={enumOptions("bookingStatus", STATUSES)}
            onChange={setStatus}
          />
          <Checkbox checked={needsScheduling} onChange={(e) => setNeedsScheduling(e.target.checked)}>
            {t("admin:bookings.needsScheduling")}
          </Checkbox>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/bookings/new")}
          className="w-full font-semibold sm:w-auto"
        >
          {t("admin:bookings.addBooking")}
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        onRow={(booking) => ({ onClick: () => navigate(`/admin/bookings/${booking.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:bookings.reference"), dataIndex: "referenceNumber" },
          {
            title: t("admin:bookings.status"),
            dataIndex: "status",
            render: (value: BookingStatus) => <Tag>{enumLabel("bookingStatus", value)}</Tag>,
          },
          {
            title: t("admin:bookings.total"),
            dataIndex: "totalSnapshot",
            render: (value: number | null) =>
              value != null ? formatCurrency(value, i18n.language) : "—",
          },
          {
            title: t("admin:bookings.created"),
            dataIndex: "createdAt",
            render: (value: string) => formatDateTime(value, i18n.language),
          },
        ]}
      />
    </div>
  );
}
