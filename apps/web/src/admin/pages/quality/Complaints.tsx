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

export default function Complaints() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<QualityIssueStatus>();
  const { data, isLoading } = useListQualityIssuesQuery({ source: "COMPLAINT", status });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:quality.complaintsTitle")}</h1>
      <Select
        allowClear
        size="large"
        className="mb-4 w-full sm:w-64"
        placeholder={t("admin:bookings.filterByStatus")}
        options={enumOptions("qualityIssueStatus", STATUSES)}
        onChange={setStatus}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        onRow={(item) => ({ onClick: () => navigate(`/admin/quality/${item.id}`) })}
        scroll={{ x: 1100 }}
        columns={[
          {
            title: t("admin:quality.bookingReference"),
            render: (_, item) => item.booking.referenceNumber,
          },
          {
            title: t("admin:quality.customerName"),
            render: (_, item) => item.booking.customer.user.fullName,
          },
          {
            title: t("admin:quality.phone"),
            render: (_, item) => item.booking.customer.user.phoneNormalized ?? "-",
          },
          {
            title: t("admin:quality.service"),
            render: (_, item) => item.booking.items[0]?.service.nameAr ?? "-",
          },
          {
            title: t("admin:quality.category"),
            dataIndex: "category",
            render: (value: string) => t(`customer:complaintForm.categories.${value}`),
          },
          {
            title: t("admin:quality.description"),
            dataIndex: "description",
            ellipsis: true,
            width: 220,
          },
          { title: t("admin:quality.severity"), dataIndex: "severity", render: (v: string) => <Tag>{enumLabel("qualityIssueSeverity", v)}</Tag> },
          { title: t("admin:bookings.status"), dataIndex: "status", render: (v: string) => <Tag>{enumLabel("qualityIssueStatus", v)}</Tag> },
          { title: t("admin:bookings.created"), dataIndex: "createdAt", render: (v: string) => formatDateTime(v, i18n.language) },
        ]}
      />
    </div>
  );
}
