import { Empty, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useListOwnSubscriptionsQuery } from "../../api/subscriptionsApi";
import { formatCurrency, formatDateTime } from "../../lib/formatters";
import { enumLabel } from "../../lib/enumLabels";
import { SUBSCRIPTION_FREQUENCY_ICON, SUBSCRIPTION_STATUS_TONE } from "../../lib/subscriptionMeta";
import { ListCard } from "../../components/ListCard";

// T155 (US7): read-only — subscriptions are Admin-managed (US7's title is
// "Admin Manages Recurring Subscriptions"); the customer view has no
// edit/pause/cancel controls, so rows are plain view-only cards (no href).
export default function Subscriptions() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListOwnSubscriptionsQuery();

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="list-page-header">
          <h1 className="text-xl font-semibold text-ink">{t("nav.mySubscriptions")}</h1>
          {!isLoading && data && data.length > 0 && (
            <span className="list-page-count">
              {t("customer:subscriptions.count", { count: data.length })}
            </span>
          )}
        </div>

        {isLoading && <Skeleton active />}

        {!isLoading && data?.length === 0 && (
          <Empty description={t("customer:subscriptions.emptyTitle")} />
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="list-page-items">
            {data.map((subscription) => (
              <ListCard
                key={subscription.id}
                tone={SUBSCRIPTION_STATUS_TONE[subscription.status]}
                icon={SUBSCRIPTION_FREQUENCY_ICON[subscription.frequency]}
                title={enumLabel("subscriptionFrequency", subscription.frequency)}
                subtitle={t("customer:subscriptions.starts", {
                  date: formatDateTime(subscription.startsAt, i18n.language),
                })}
                pill={enumLabel("subscriptionStatus", subscription.status)}
                value={formatCurrency(subscription.priceSnapshot, i18n.language)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
