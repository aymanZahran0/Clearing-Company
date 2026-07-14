import { List, Skeleton, Tag } from "antd";
import { useListOwnSubscriptionsQuery } from "../../api/subscriptionsApi";
import { formatCurrency, formatDateTime } from "../../lib/formatters";

// T155 (US7): read-only — subscriptions are Admin-managed (US7's title is
// "Admin Manages Recurring Subscriptions"); the customer view has no
// edit/pause/cancel controls.
export default function Subscriptions() {
  const { data, isLoading } = useListOwnSubscriptionsQuery();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">My Subscriptions</h1>
      <List
        dataSource={data}
        renderItem={(subscription) => (
          <List.Item>
            <div>
              <div className="font-medium">
                {subscription.frequency} — {formatCurrency(subscription.priceSnapshot, "en")}
              </div>
              <div className="text-sm text-gray-500">
                Starts {formatDateTime(subscription.startsAt, "en")}
              </div>
              <Tag>{subscription.status}</Tag>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
