import { useState } from "react";
import { Select, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useListNotificationLogsQuery } from "../../../api/notificationsApi";
import { formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

// T177 (US-Polish)
export default function Log() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading } = useListNotificationLogsQuery({ status });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:notifications.logTitle")}</h1>
      <Select
        allowClear
        placeholder={t("admin:bookings.filterByStatus")}
        size="large"
        className="mb-4 w-full sm:w-64"
        options={enumOptions("notificationStatus", ["SENT", "FAILED", "PENDING"])}
        onChange={setStatus}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        columns={[
          {
            title: t("admin:notifications.template"),
            dataIndex: "templateKey",
            render: (v: string) => enumLabel("notificationTemplateKey", v),
          },
          {
            title: t("admin:notifications.channel"),
            dataIndex: "channel",
            render: (v: string) => enumLabel("notificationChannel", v),
          },
          {
            title: t("admin:bookings.status"),
            dataIndex: "status",
            render: (v: string) => <Tag>{enumLabel("notificationStatus", v)}</Tag>,
          },
          {
            title: t("admin:notifications.failureReason"),
            dataIndex: "failureReason",
            render: (v: string | null) => v ?? "—",
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
