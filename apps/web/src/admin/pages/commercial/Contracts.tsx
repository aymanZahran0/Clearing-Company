import { useState } from "react";
import { Button, Descriptions, Form, Input, List, Modal, Select, Skeleton, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  useCreateContractMutation,
  useGetCommercialAccountQuery,
  useUpdateContractMutation,
} from "../../../api/commercialApi";
import { formatDateTime } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

interface ContractFormValues {
  startDate: string;
  endDate?: string;
  documentReference?: string;
}

// T154 (US7): a commercial account's locations + contracts, with contract
// creation and status updates.
export default function Contracts() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading, refetch } = useGetCommercialAccountQuery(id ?? "", { skip: !id });
  const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
  const [updateContract] = useUpdateContractMutation();
  const [open, setOpen] = useState(false);

  if (isLoading || !account) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  async function onFinish(values: ContractFormValues) {
    if (!id) return;
    try {
      await createContract({
        accountId: id,
        startDate: values.startDate,
        endDate: values.endDate,
        documentReference: values.documentReference,
        pricingTerms: {},
      }).unwrap();
      setOpen(false);
      message.success(t("admin:commercial.contractCreated"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{account.companyName}</h1>
      <Descriptions column={1} bordered size="middle" className="mb-6">
        <Descriptions.Item label={t("admin:commercial.billingContact")}>
          {account.billingContactName} — {account.billingContactPhone}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:commercial.email")}>
          {account.billingContactEmail ?? "—"}
        </Descriptions.Item>
      </Descriptions>

      <h2 className="mb-2 text-base font-medium">{t("admin:commercial.locations")}</h2>
      <List
        dataSource={account.locations}
        renderItem={(location) => <List.Item>{location.label ?? location.addressId}</List.Item>}
        className="mb-6"
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium">{t("admin:commercial.contracts")}</h2>
        <Button type="primary" onClick={() => setOpen(true)}>
          {t("admin:commercial.newContract")}
        </Button>
      </div>
      <List
        dataSource={account.contracts}
        renderItem={(contract) => (
          <List.Item
            actions={[
              <Select
                key="status"
                size="small"
                value={contract.status}
                style={{ width: 120 }}
                options={enumOptions("contractStatus", ["ACTIVE", "EXPIRED", "TERMINATED"])}
                onChange={(status) =>
                  updateContract({ id: contract.id, body: { status } }).then(() => refetch())
                }
              />,
            ]}
          >
            {formatDateTime(contract.startDate, i18n.language)}
            {contract.endDate ? ` – ${formatDateTime(contract.endDate, i18n.language)}` : ""}{" "}
            <Tag>{enumLabel("contractStatus", contract.status)}</Tag>
          </List.Item>
        )}
      />

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:commercial.newContract")}>
        <Form<ContractFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="startDate" label={t("admin:commercial.startDate")} rules={[{ required: true }]}>
            <Input type="date" size="large" />
          </Form.Item>
          <Form.Item name="endDate" label={t("admin:commercial.endDate")}>
            <Input type="date" size="large" />
          </Form.Item>
          <Form.Item name="documentReference" label={t("admin:commercial.documentReference")}>
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
