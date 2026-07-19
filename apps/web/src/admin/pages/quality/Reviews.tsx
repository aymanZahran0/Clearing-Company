import { Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useListQualityIssuesQuery } from "../../../api/qualityIssuesApi";
import { formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";

// T142 (US6): low-rating reviews surface as QualityIssue rows with
// `source = REVIEW` (auto-created by FR-054 when rating <= 2) — the
// Admin quality queue is a single unified entity across review/complaint/
// checklist-failure sources, so this page is a filtered view of it rather
// than a separate Review listing endpoint.
export default function Reviews() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useListQualityIssuesQuery({ source: "REVIEW" });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:quality.lowRatingReviewsTitle")}</h1>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        onRow={(issue) => ({ onClick: () => navigate(`/admin/quality/${issue.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:quality.category"), dataIndex: "category" },
          {
            title: t("admin:quality.severity"),
            dataIndex: "severity",
            render: (value: string) => <Tag>{enumLabel("qualityIssueSeverity", value)}</Tag>,
          },
          {
            title: t("admin:bookings.status"),
            dataIndex: "status",
            render: (value: string) => <Tag>{enumLabel("qualityIssueStatus", value)}</Tag>,
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
