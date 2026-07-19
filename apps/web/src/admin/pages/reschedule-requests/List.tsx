import { useState } from "react";
import { Button, Popconfirm, Select, Table, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import {
  useApproveRescheduleRequestMutation,
  useListRescheduleRequestsQuery,
  type RescheduleRequest,
  type RescheduleRequestStatus,
} from "../../../api/rescheduleRequestsApi";
import { formatDateTime } from "../../../lib/formatters";
import { RejectRescheduleDialog } from "./RejectRescheduleDialog";

const STATUS_COLOR: Record<RescheduleRequestStatus, string> = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  AUTO_REJECTED: "default",
};

const STATUS_LABEL_KEYS: Record<RescheduleRequestStatus, string> = {
  PENDING: "admin:rescheduleRequests.pending",
  APPROVED: "admin:rescheduleRequests.approvedStatus",
  REJECTED: "admin:rescheduleRequests.rejectedStatus",
  AUTO_REJECTED: "admin:rescheduleRequests.autoRejectedStatus",
};

// T105 (US10): approval queue for Customer-submitted reschedule requests.
// Approval delegates the actual schedule/capacity mutation to the backend's
// rescheduleBooking() (contracts/reschedule-requests.md) — this page only
// decides PENDING -> APPROVED/REJECTED.
export default function RescheduleRequestsList() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<RescheduleRequestStatus | undefined>("PENDING");
  const { data, isLoading, refetch } = useListRescheduleRequestsQuery({ status });
  const [approve, { isLoading: isApproving }] = useApproveRescheduleRequestMutation();

  async function onApprove(id: string) {
    try {
      await approve({ id }).unwrap();
      message.success(t("admin:rescheduleRequests.approved"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:rescheduleRequests.title")}</h1>
      <Select
        allowClear
        size="large"
        className="mb-4 w-full sm:w-64"
        placeholder={t("admin:jobRuns.filterByStatus")}
        value={status}
        onChange={setStatus}
        options={[
          { value: "PENDING", label: t("admin:rescheduleRequests.pending") },
          { value: "APPROVED", label: t("admin:rescheduleRequests.approvedStatus") },
          { value: "REJECTED", label: t("admin:rescheduleRequests.rejectedStatus") },
          { value: "AUTO_REJECTED", label: t("admin:rescheduleRequests.autoRejectedStatus") },
        ]}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        pagination={{ total: data?.total, pageSize: data?.pageSize }}
        columns={[
          {
            title: t("admin:bookings.reference"),
            render: (_: unknown, row: RescheduleRequest) => row.booking?.referenceNumber ?? "—",
          },
          {
            title: t("admin:subscriptions.customer"),
            render: (_: unknown, row: RescheduleRequest) => row.booking?.customer.user.fullName ?? "—",
          },
          {
            title: t("admin:rescheduleRequests.currentSchedule"),
            render: (_: unknown, row: RescheduleRequest) =>
              row.booking?.scheduledStartAt ? formatDateTime(row.booking.scheduledStartAt, i18n.language) : "—",
          },
          {
            title: t("admin:rescheduleRequests.requestedSchedule"),
            dataIndex: "requestedStartAt",
            render: (v: string) => formatDateTime(v, i18n.language),
          },
          { title: t("admin:bookings.reason"), dataIndex: "reason", render: (v: string | null) => v ?? "—" },
          {
            title: t("admin:bookings.status"),
            dataIndex: "status",
            render: (v: RescheduleRequestStatus) => <Tag color={STATUS_COLOR[v]}>{t(STATUS_LABEL_KEYS[v])}</Tag>,
          },
          {
            title: "",
            render: (_: unknown, row: RescheduleRequest) =>
              row.status === "PENDING" ? (
                <div className="flex flex-wrap gap-2">
                  <Popconfirm
                    title={t("admin:rescheduleRequests.approveConfirm")}
                    onConfirm={() => onApprove(row.id)}
                  >
                    <Button type="primary" size="small" loading={isApproving}>
                      {t("admin:rescheduleRequests.approve")}
                    </Button>
                  </Popconfirm>
                  <RejectRescheduleDialog requestId={row.id} onDone={refetch} />
                </div>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
