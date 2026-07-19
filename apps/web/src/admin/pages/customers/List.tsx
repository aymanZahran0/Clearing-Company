import { useState } from "react";
import { Input, Select, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSearchCustomersQuery, type CustomerSummary } from "../../../api/customersApi";
import { formatDateTime, formatSaudiPhoneForDisplay } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";
import { SuspendCustomerDialog } from "./SuspendCustomerDialog";
import { ReactivateCustomerDialog } from "./ReactivateCustomerDialog";

const STATUSES: CustomerSummary["status"][] = ["ACTIVE", "INVITED", "SUSPENDED"];

const STATUS_COLOR: Record<CustomerSummary["status"], string> = {
  ACTIVE: "green",
  INVITED: "gold",
  SUSPENDED: "red",
};

// US5: Admin customer-account management — list/search/filter, suspend,
// and reactivate, without ever exposing secrets (FR-018/FR-019) or
// touching business history (FR-016).
export default function CustomersList() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState<string | undefined>();
  const [status, setStatus] = useState<CustomerSummary["status"] | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSearchCustomersQuery({ search, status, page, pageSize: 20 });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:customers.title")}</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input.Search
          allowClear
          placeholder={t("admin:customers.searchPlaceholder")}
          size="large"
          className="w-full sm:w-80"
          onSearch={(value) => {
            setSearch(value || undefined);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder={t("admin:customers.filterByStatus")}
          size="large"
          className="w-full sm:w-56"
          options={enumOptions("userStatus", STATUSES)}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: data?.pageSize ?? 20,
          onChange: setPage,
        }}
        columns={[
          {
            title: t("admin:customers.name"),
            dataIndex: "fullName",
            render: (value: string, row: CustomerSummary) => (
              <Link to={`/admin/customers/${row.id}`}>{value}</Link>
            ),
          },
          {
            title: t("admin:customers.phone"),
            dataIndex: "phone",
            render: (v: string | null) => (v ? formatSaudiPhoneForDisplay(v) : "—"),
          },
          { title: t("admin:customers.email"), dataIndex: "email", render: (v: string | null) => v ?? "—" },
          {
            title: t("admin:customers.status"),
            dataIndex: "status",
            render: (value: CustomerSummary["status"]) => (
              <Tag color={STATUS_COLOR[value]}>{enumLabel("userStatus", value)}</Tag>
            ),
          },
          {
            title: t("admin:customers.createdAt"),
            dataIndex: "createdAt",
            render: (value: string) => formatDateTime(value, i18n.language),
          },
          {
            title: t("admin:customers.lastLogin"),
            dataIndex: "lastLoginAt",
            render: (value: string | null) => (value ? formatDateTime(value, i18n.language) : "—"),
          },
          { title: t("admin:customers.bookingsCount"), dataIndex: "bookingsCount" },
          {
            title: "",
            render: (_: unknown, row: CustomerSummary) => (
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/customers/${row.id}`}>{t("admin:customers.viewDetails")}</Link>
                {row.status === "SUSPENDED" ? (
                  <ReactivateCustomerDialog customerId={row.id} triggerSize="small" />
                ) : (
                  <SuspendCustomerDialog customerId={row.id} triggerSize="small" />
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
