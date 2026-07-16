import { Button, Form, Input, Modal, Table, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  useCreateCommercialAccountMutation,
  useListCommercialAccountsQuery,
  type CommercialAccount,
  type CreateCommercialAccountInput,
} from "../../../api/commercialApi";

// T154 (US7)
export default function Accounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: accounts, isLoading } = useListCommercialAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateCommercialAccountMutation();
  const [open, setOpen] = useState(false);

  async function onFinish(values: CreateCommercialAccountInput) {
    try {
      await createAccount(values).unwrap();
      setOpen(false);
      message.success(t("admin:commercial.accountCreated"));
    } catch {
      message.error(t("admin:commercial.accountCreateError"));
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin:commercial.accountsTitle")}</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          {t("admin:commercial.newAccount")}
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={accounts}
        onRow={(account) => ({ onClick: () => navigate(`/admin/commercial/${account.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:commercial.company"), dataIndex: "companyName" },
          { title: t("admin:commercial.billingContact"), dataIndex: "billingContactName" },
          { title: t("admin:commercial.phone"), dataIndex: "billingContactPhone" },
          {
            title: t("admin:commercial.locations"),
            render: (_: unknown, row: CommercialAccount) => row.locations.length,
          },
          {
            title: t("admin:commercial.contracts"),
            render: (_: unknown, row: CommercialAccount) => row.contracts.length,
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:commercial.newAccount")}>
        <Form<CreateCommercialAccountInput> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="companyName" label={t("admin:commercial.companyName")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="billingContactName"
            label={t("admin:commercial.billingContactName")}
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="billingContactPhone"
            label={t("admin:commercial.billingContactPhone")}
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item name="billingContactEmail" label={t("admin:commercial.billingContactEmail")}>
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.create")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
