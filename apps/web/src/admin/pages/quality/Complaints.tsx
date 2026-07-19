import { useState } from "react";
import { Select, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  useListQualityIssuesQuery,
  type QualityIssueStatus,
} from "../../../api/qualityIssuesApi";
import { formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

const STATUSES: QualityIssueStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

// T142 (US6): the general quality-issue queue, defaulting to complaints
// but filterable across every source/status.
export default function Complaints() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<QualityIssueStatus | undefined>();
  const { data, isLoading } = useListQualityIssuesQuery({ source: "COMPLAINT", status });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:quality.complaintsTitle")}</h1>
      <Select
        allowClear
        placeholder={t("admin:bookings.filterByStatus")}
        size="large"
        className="mb-4 w-full sm:w-64"
        options={enumOptions("qualityIssueStatus", STATUSES)}
        onChange={setStatus}
      />
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
