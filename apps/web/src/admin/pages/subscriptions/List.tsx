import { useState } from "react";
import { Button, Select, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useListSubscriptionsQuery, type SubscriptionStatus } from "../../../api/subscriptionsApi";
import { formatCurrency, formatDateTime } from "../../../lib/formatters";

const STATUSES: SubscriptionStatus[] = ["ACTIVE", "PAUSED", "CANCELLED"];

// T153 (US7)
export default function SubscriptionsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | undefined>();
  const { data, isLoading } = useListSubscriptionsQuery({ status });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin:subscriptions.title")}</h1>
        <Link to="/admin/subscriptions/new">
          <Button type="primary" size="large">
            {t("admin:subscriptions.newSubscription")}
          </Button>
        </Link>
      </div>
      <Select
        allowClear
        placeholder={t("admin:bookings.filterByStatus")}
        size="large"
        className="mb-4 w-full sm:w-64"
        options={STATUSES.map((s) => ({ value: s, label: s }))}
        onChange={setStatus}
      />
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        onRow={(subscription) => ({ onClick: () => navigate(`/admin/subscriptions/${subscription.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:subscriptions.frequency"), dataIndex: "frequency" },
          {
            title: t("admin:pricing.amount"),
            dataIndex: "priceSnapshot",
            render: (value: number) => formatCurrency(value, "en"),
          },
          {
            title: t("admin:bookings.status"),
            dataIndex: "status",
            render: (value: string) => <Tag>{value}</Tag>,
          },
          {
            title: t("admin:subscriptions.starts"),
            dataIndex: "startsAt",
            render: (value: string) => formatDateTime(value, "en"),
          },
        ]}
      />
    </div>
  );
}
