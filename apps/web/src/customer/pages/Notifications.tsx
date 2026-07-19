import { List, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useListOwnNotificationLogsQuery } from "../../api/notificationsApi";
import { formatDateTime } from "../../lib/formatters";
import { enumLabel } from "../../lib/enumLabels";

// T178: customer-visible notification history (FR-069 read scope) — the
// customer sees which events were sent to them, never other customers'
// logs, and never the underlying recipient/PII payload.
export default function Notifications() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListOwnNotificationLogsQuery();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.notifications")}</h1>
      <List
        dataSource={data}
        renderItem={(log) => (
          <List.Item>
            <div>
              <div className="font-medium">{enumLabel("notificationTemplateKey", log.templateKey)}</div>
              <div className="text-sm text-gray-500">{formatDateTime(log.createdAt, i18n.language)}</div>
              <Tag>{enumLabel("notificationStatus", log.status)}</Tag>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
