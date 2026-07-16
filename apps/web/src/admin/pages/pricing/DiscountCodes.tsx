import { useState } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  useCreateDiscountCodeMutation,
  useDisableDiscountCodeMutation,
  useListDiscountCodesQuery,
  type DiscountCode,
  type DiscountCodeInput,
} from "../../../api/discountCodesApi";

interface FormValues {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  amount: number;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  usageLimit?: number;
}

const { RangePicker } = DatePicker;

// T176 (US-Polish): completes the read/validate-only path from US1 with
// full Admin CRUD.
export default function DiscountCodes() {
  const { t } = useTranslation();
  const { data, isLoading } = useListDiscountCodesQuery();
  const [createCode, { isLoading: isCreating }] = useCreateDiscountCodeMutation();
  const [disableCode] = useDisableDiscountCodeMutation();
  const [open, setOpen] = useState(false);

  async function onFinish(values: FormValues) {
    const body: DiscountCodeInput = {
      code: values.code,
      type: values.type,
      amount: values.amount,
      validFrom: values.range[0].toISOString(),
      validTo: values.range[1].toISOString(),
      usageLimit: values.usageLimit,
    };
    try {
      await createCode(body).unwrap();
      setOpen(false);
      message.success(t("admin:pricing.discountCodeCreated"));
    } catch {
      message.error(t("admin:pricing.discountCodeCreateError"));
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin:pricing.discountCodesTitle")}</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          {t("admin:pricing.newCode")}
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:pricing.code"), dataIndex: "code" },
          { title: t("admin:content.type"), dataIndex: "type" },
          { title: t("admin:pricing.amount"), dataIndex: "amount" },
          {
            title: t("admin:pricing.used"),
            render: (_: unknown, row: DiscountCode) =>
              `${row.usageCount}${row.usageLimit ? `/${row.usageLimit}` : ""}`,
          },
          {
            title: t("admin:content.active"),
            dataIndex: "active",
            render: (v: boolean) => <Tag>{v ? t("admin:common.active") : t("admin:common.disabled")}</Tag>,
          },
          {
            title: "",
            render: (_: unknown, row: DiscountCode) =>
              row.active && (
                <Button danger size="small" onClick={() => disableCode(row.id)}>
                  {t("admin:pricing.disable")}
                </Button>
              ),
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:pricing.newDiscountCode")}>
        <Form<FormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="code" label={t("admin:pricing.code")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="type" label={t("admin:content.type")} rules={[{ required: true }]}>
            <Select size="large" options={["PERCENTAGE", "FIXED"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="amount" label={t("admin:pricing.amount")} rules={[{ required: true }]}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="range" label={t("admin:pricing.validRange")} rules={[{ required: true }]}>
            <RangePicker size="large" className="w-full" />
          </Form.Item>
          <Form.Item name="usageLimit" label={t("admin:pricing.usageLimitOptional")}>
            <InputNumber size="large" min={1} className="w-full" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.create")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
