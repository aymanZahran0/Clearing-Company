import { useState } from "react";
import { Input, Table } from "antd";
import { useListAuditLogsQuery } from "../../../api/reportsApi";
import { formatDateTime } from "../../../lib/formatters";

// T166 (US8)
export default function AuditLogViewer() {
  const [entityType, setEntityType] = useState<string | undefined>();
  const { data, isLoading } = useListAuditLogsQuery({ entityType });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Audit Log</h1>
      <Input
        placeholder="Filter by entity type (e.g. Booking)"
        size="large"
        className="mb-4 w-full sm:w-64"
        onChange={(e) => setEntityType(e.target.value || undefined)}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        columns={[
          { title: "Action", dataIndex: "action" },
          { title: "Entity Type", dataIndex: "entityType" },
          { title: "Entity ID", dataIndex: "entityId" },
          {
            title: "Timestamp",
            dataIndex: "createdAt",
            render: (value: string) => formatDateTime(value, "en"),
          },
        ]}
      />
    </div>
  );
}
