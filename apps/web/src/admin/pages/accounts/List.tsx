import { Table, Tag, Button, message, Popconfirm } from "antd";
import { useTranslation } from "react-i18next";
import {
  useListAdminAccountsQuery,
  useSuspendAdminAccountMutation,
  useReactivateAdminAccountMutation,
  type AdminAccount,
} from "../../../api/adminAccountsApi";
import { formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { InviteDialog } from "./InviteDialog";
import { ResetDialog } from "./ResetDialog";

// T068-T079 (US6): list/invite/suspend/reactivate/reset-credential, with
// the last-active-Admin protection enforced server-side
// (apps/api/src/modules/admin-accounts/service.ts) and surfaced here as a
// 409 message rather than a disabled control (avoids a race between two
// Admins suspending different accounts at once).
export default function AdminAccountsList() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListAdminAccountsQuery();
  const [suspend, { isLoading: isSuspending }] = useSuspendAdminAccountMutation();
  const [reactivate, { isLoading: isReactivating }] = useReactivateAdminAccountMutation();

  async function onSuspend(id: string) {
    try {
      await suspend(id).unwrap();
      message.success(t("admin:accounts.suspended"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function onReactivate(id: string) {
    try {
      await reactivate(id).unwrap();
      message.success(t("admin:accounts.reactivated"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin:accounts.title")}</h1>
        <InviteDialog />
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: t("auth.fullName"), dataIndex: "fullName" },
          { title: t("auth.email"), dataIndex: "email" },
          {
            title: t("admin:bookings.status"),
            dataIndex: "status",
            render: (v: AdminAccount["status"]) => <Tag>{enumLabel("userStatus", v)}</Tag>,
          },
          {
            title: t("admin:accounts.lastLogin"),
            dataIndex: "lastLoginAt",
            render: (v: string | null) => (v ? formatDateTime(v, i18n.language) : "—"),
          },
          {
            title: "",
            render: (_: unknown, row: AdminAccount) => (
              <div className="flex flex-wrap gap-2">
                {row.status === "SUSPENDED" ? (
                  <Button size="small" loading={isReactivating} onClick={() => onReactivate(row.id)}>
                    {t("admin:accounts.reactivate")}
                  </Button>
                ) : (
                  <Popconfirm
                    title={t("admin:accounts.suspendConfirm")}
                    onConfirm={() => onSuspend(row.id)}
                  >
                    <Button size="small" danger loading={isSuspending}>
                      {t("admin:accounts.suspend")}
                    </Button>
                  </Popconfirm>
                )}
                <ResetDialog accountId={row.id} accountName={row.fullName} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
