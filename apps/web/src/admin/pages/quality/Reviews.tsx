import { Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { useListQualityIssuesQuery } from "../../../api/qualityIssuesApi";
import { formatDateTime } from "../../../lib/formatters";

// T142 (US6): low-rating reviews surface as QualityIssue rows with
// `source = REVIEW` (auto-created by FR-054 when rating <= 2) — the
// Admin quality queue is a single unified entity across review/complaint/
// checklist-failure sources, so this page is a filtered view of it rather
// than a separate Review listing endpoint.
export default function Reviews() {
  const navigate = useNavigate();
  const { data, isLoading } = useListQualityIssuesQuery({ source: "REVIEW" });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Low-Rating Reviews</h1>
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
