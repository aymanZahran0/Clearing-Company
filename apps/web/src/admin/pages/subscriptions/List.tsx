import { useState } from "react";
import { Button, Select, Table, Tag } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useListSubscriptionsQuery, type SubscriptionStatus } from "../../../api/subscriptionsApi";
import { formatCurrency, formatDateTime } from "../../../lib/formatters";

const STATUSES: SubscriptionStatus[] = ["ACTIVE", "PAUSED", "CANCELLED"];

// T153 (US7)
export default function SubscriptionsList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | undefined>();
  const { data, isLoading } = useListSubscriptionsQuery({ status });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Subscriptions</h1>
        <Link to="/admin/subscriptions/new">
          <Button type="primary" size="large">
            New Subscription
          </Button>
        </Link>
      </div>
      <Select
        allowClear
        placeholder="Filter by status"
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
          { title: "Frequency", dataIndex: "frequency" },
          {
            title: "Price",
            dataIndex: "priceSnapshot",
            render: (value: number) => formatCurrency(value, "en"),
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (value: string) => <Tag>{value}</Tag>,
          },
          {
            title: "Starts",
            dataIndex: "startsAt",
            render: (value: string) => formatDateTime(value, "en"),
          },
        ]}
      />
    </div>
  );
}
