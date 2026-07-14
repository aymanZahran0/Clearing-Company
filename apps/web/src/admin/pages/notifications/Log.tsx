import { useState } from "react";
import { Select, Table, Tag } from "antd";
import { useListNotificationLogsQuery } from "../../../api/notificationsApi";
import { formatDateTime } from "../../../lib/formatters";

// T177 (US-Polish)
export default function Log() {
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading } = useListNotificationLogsQuery({ status });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Notification Log</h1>
      <Select
        allowClear
        placeholder="Filter by status"
        size="large"
        className="mb-4 w-full sm:w-64"
        options={["SENT", "FAILED", "PENDING"].map((s) => ({ value: s, label: s }))}
        onChange={setStatus}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        columns={[
          { title: "Template", dataIndex: "templateKey" },
          { title: "Channel", dataIndex: "channel" },
          { title: "Status", dataIndex: "status", render: (v: string) => <Tag>{v}</Tag> },
          { title: "Failure Reason", dataIndex: "failureReason", render: (v: string | null) => v ?? "—" },
          {
            title: "Created",
            dataIndex: "createdAt",
            render: (value: string) => formatDateTime(value, "en"),
          },
        ]}
      />
    </div>
  );
}
