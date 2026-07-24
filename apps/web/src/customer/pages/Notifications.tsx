import { Empty, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useListOwnNotificationLogsQuery } from "../../api/notificationsApi";
import { formatDateTime } from "../../lib/formatters";
import { enumLabel } from "../../lib/enumLabels";
import { NOTIFICATION_CHANNEL_ICON, NOTIFICATION_STATUS_TONE } from "../../lib/notificationMeta";
import { ListCard } from "../../components/ListCard";

// T178: customer-visible notification history (FR-069 read scope) — the
// customer sees which events were sent to them, never other customers'
// logs, and never the underlying recipient/PII payload. Rows are view-only
// (no href) — there's no notification detail route.
export default function Notifications() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListOwnNotificationLogsQuery();

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="list-page-header">
          <h1 className="text-xl font-semibold text-ink">{t("nav.notifications")}</h1>
          {!isLoading && data && data.length > 0 && (
            <span className="list-page-count">
              {t("customer:notifications.count", { count: data.length })}
            </span>
          )}
        </div>

        {isLoading && <Skeleton active />}

        {!isLoading && data?.length === 0 && (
          <Empty description={t("customer:notifications.emptyTitle")} />
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="list-page-items">
            {data.map((log) => (
              <ListCard
                key={log.id}
                tone={NOTIFICATION_STATUS_TONE[log.status]}
                icon={NOTIFICATION_CHANNEL_ICON[log.channel]}
                title={enumLabel("notificationTemplateKey", log.templateKey)}
                subtitle={formatDateTime(log.createdAt, i18n.language)}
                pill={enumLabel("notificationStatus", log.status)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
