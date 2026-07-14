import { Button, Form, Input, Modal, Table, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateCommercialAccountMutation,
  useListCommercialAccountsQuery,
  type CommercialAccount,
  type CreateCommercialAccountInput,
} from "../../../api/commercialApi";

// T154 (US7)
export default function Accounts() {
  const navigate = useNavigate();
  const { data: accounts, isLoading } = useListCommercialAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateCommercialAccountMutation();
  const [open, setOpen] = useState(false);

  async function onFinish(values: CreateCommercialAccountInput) {
    try {
      await createAccount(values).unwrap();
      setOpen(false);
      message.success("Commercial account created");
    } catch {
      message.error("Could not create the commercial account");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Commercial Accounts</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          New Account
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={accounts}
        onRow={(account) => ({ onClick: () => navigate(`/admin/commercial/${account.id}`) })}
        scroll={{ x: true }}
        columns={[
          { title: "Company", dataIndex: "companyName" },
          { title: "Billing Contact", dataIndex: "billingContactName" },
          { title: "Phone", dataIndex: "billingContactPhone" },
          {
            title: "Locations",
            render: (_: unknown, row: CommercialAccount) => row.locations.length,
          },
          {
            title: "Contracts",
            render: (_: unknown, row: CommercialAccount) => row.contracts.length,
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="New Commercial Account">
        <Form<CreateCommercialAccountInput> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="billingContactName" label="Billing Contact Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="billingContactPhone" label="Billing Contact Phone" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="billingContactEmail" label="Billing Contact Email">
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            Create
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
