import { useState } from "react";
import { Button, Input, Popconfirm, Select, Table, Tag, Tooltip, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  useDeleteCustomerMutation,
  useSearchCustomersQuery,
  type CustomerSummary,
} from "../../../api/customersApi";
import { formatDateTime, formatSaudiPhoneForDisplay } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";
import { SuspendCustomerDialog } from "./SuspendCustomerDialog";
import { ReactivateCustomerDialog } from "./ReactivateCustomerDialog";
import { ViewDetailsLink } from "../../components/ViewDetailsLink";

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
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  async function removeCustomer(customer: CustomerSummary) {
    try {
      await deleteCustomer(customer.id).unwrap();
      message.success(t("admin:customers.deleted"));
    } catch {
      // The global RTK Query middleware shows the API error.
    }
  }

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
            title: t("admin:common.actions"),
            align: "center",
            render: (_: unknown, row: CustomerSummary) => (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <ViewDetailsLink to={`/admin/customers/${row.id}`} />
                {row.status === "SUSPENDED" ? (
                  <ReactivateCustomerDialog customerId={row.id} triggerSize="small" />
                ) : (
                  <SuspendCustomerDialog customerId={row.id} triggerSize="small" />
                )}
                {row.bookingsCount > 0 ? (
                  <Tooltip title={t("admin:customers.cannotDeleteWithBookings")}>
                    <Button
                      size="small"
                      danger
                      disabled
                      icon={<DeleteOutlined />}
                      aria-label={t("admin:customers.delete")}
                    />
                  </Tooltip>
                ) : (
                  <Popconfirm
                    title={t("admin:customers.deleteTitle")}
                    description={t("admin:customers.deleteConfirmBody", { name: row.fullName })}
                    okText={t("admin:customers.delete")}
                    cancelText={t("common.cancel")}
                    okButtonProps={{ danger: true, loading: isDeleting }}
                    onConfirm={() => removeCustomer(row)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t("admin:customers.delete")}
                      title={t("admin:customers.delete")}
                    />
                  </Popconfirm>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
