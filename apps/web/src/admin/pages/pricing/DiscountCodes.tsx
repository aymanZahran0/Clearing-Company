import { useState } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tooltip, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  useCreateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
  useListDiscountCodesQuery,
  useUpdateDiscountCodeMutation,
  type DiscountCode,
  type DiscountCodeInput,
} from "../../../api/discountCodesApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

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
  const [updateCode, { isLoading: isUpdating }] = useUpdateDiscountCodeMutation();
  const [deleteCode, { isLoading: isDeleting }] = useDeleteDiscountCodeMutation();
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
      // toast shown by the global RTK Query error middleware
    }
  }

  async function onToggleActive(row: DiscountCode, active: boolean) {
    try {
      await updateCode({ id: row.id, body: { active } }).unwrap();
      message.success(t(active ? "admin:pricing.codeActivated" : "admin:pricing.codeDeactivated"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteCode(id).unwrap();
      message.success(t("admin:pricing.codeDeleted"));
    } catch {
      // toast shown by the global RTK Query error middleware
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
          {
            title: t("admin:content.type"),
            dataIndex: "type",
            render: (value: string) => enumLabel("discountType", value),
          },
          { title: t("admin:pricing.amount"), dataIndex: "amount" },
          {
            title: t("admin:pricing.used"),
            render: (_: unknown, row: DiscountCode) =>
              `${row.usageCount}${row.usageLimit ? `/${row.usageLimit}` : ""}`,
          },
          {
            title: t("admin:content.active"),
            dataIndex: "active",
            align: "center",
            render: (active: boolean, row: DiscountCode) => (
              <Tooltip title={t(active ? "admin:pricing.disable" : "admin:pricing.activate")}>
                <Switch
                  checked={active}
                  loading={isUpdating}
                  aria-label={t(active ? "admin:pricing.disable" : "admin:pricing.activate") as string}
                  onChange={(checked) => onToggleActive(row, checked)}
                />
              </Tooltip>
            ),
          },
          {
            title: t("admin:common.actions"),
            align: "center",
            render: (_: unknown, row: DiscountCode) => {
              const hasUsage = row.usageCount > 0;
              const button = (
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  aria-label={t("admin:common.delete") as string}
                  disabled={hasUsage}
                  loading={isDeleting}
                />
              );

              return hasUsage ? (
                <Tooltip title={t("admin:pricing.cannotDeleteUsedCode")}>{button}</Tooltip>
              ) : (
                <Popconfirm
                  title={t("admin:pricing.deleteCodeConfirm")}
                  okText={t("admin:common.delete")}
                  cancelText={t("common.cancel")}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(row.id)}
                >
                  {button}
                </Popconfirm>
              );
            },
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:pricing.newDiscountCode")}>
        <Form<FormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="code" label={t("admin:pricing.code")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="type" label={t("admin:content.type")} rules={[{ required: true }]}>
            <Select size="large" options={enumOptions("discountType", ["PERCENTAGE", "FIXED"])} />
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
