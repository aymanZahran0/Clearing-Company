import { useState } from "react";
import { Input, Table } from "antd";
import { useTranslation } from "react-i18next";
import { useListAuditLogsQuery } from "../../../api/reportsApi";
import { formatDateTime } from "../../../lib/formatters";

// T166 (US8)
export default function AuditLogViewer() {
  const { t, i18n } = useTranslation();
  const [entityType, setEntityType] = useState<string | undefined>();
  const { data, isLoading } = useListAuditLogsQuery({ entityType });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:reports.auditLogTitle")}</h1>
      <Input
        placeholder={t("admin:reports.filterByEntityType")}
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
          { title: t("admin:reports.action"), dataIndex: "action" },
          { title: t("admin:reports.entityType"), dataIndex: "entityType" },
          { title: t("admin:reports.entityId"), dataIndex: "entityId" },
          {
            title: t("admin:reports.timestamp"),
            dataIndex: "createdAt",
            render: (value: string) => formatDateTime(value, i18n.language),
          },
        ]}
      />
    </div>
  );
}
