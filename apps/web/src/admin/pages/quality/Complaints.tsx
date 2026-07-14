import { useState } from "react";
import { Select, Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import {
  useListQualityIssuesQuery,
  type QualityIssueStatus,
} from "../../../api/qualityIssuesApi";
import { formatDateTime } from "../../../lib/formatters";

const STATUSES: QualityIssueStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

// T142 (US6): the general quality-issue queue, defaulting to complaints
// but filterable across every source/status.
export default function Complaints() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<QualityIssueStatus | undefined>();
  const { data, isLoading } = useListQualityIssuesQuery({ source: "COMPLAINT", status });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Complaints</h1>
      <Select
        allowClear
        placeholder="Filter by status"
        size="large"
        className="mb-4 w-full sm:w-64"
        options={STATUSES.map((s) => ({ value: s, label: s }))}
        onChange={setStatus}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        onRow={(issue) => ({ onClick: () => navigate(`/admin/quality/${issue.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: "Category", dataIndex: "category" },
          {
            title: "Severity",
            dataIndex: "severity",
            render: (value: string) => <Tag>{value}</Tag>,
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (value: string) => <Tag>{value}</Tag>,
          },
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
