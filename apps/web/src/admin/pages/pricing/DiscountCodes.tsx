import { useState } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from "antd";
import dayjs from "dayjs";
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
      message.success("Discount code created");
    } catch {
      message.error("Could not create the discount code");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Discount Codes</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          New Code
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: "Code", dataIndex: "code" },
          { title: "Type", dataIndex: "type" },
          { title: "Amount", dataIndex: "amount" },
          {
            title: "Used",
            render: (_: unknown, row: DiscountCode) =>
              `${row.usageCount}${row.usageLimit ? `/${row.usageLimit}` : ""}`,
          },
          { title: "Active", dataIndex: "active", render: (v: boolean) => <Tag>{v ? "Active" : "Disabled"}</Tag> },
          {
            title: "",
            render: (_: unknown, row: DiscountCode) =>
              row.active && (
                <Button danger size="small" onClick={() => disableCode(row.id)}>
                  Disable
                </Button>
              ),
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="New Discount Code">
        <Form<FormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select size="large" options={["PERCENTAGE", "FIXED"].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="range" label="Valid Range" rules={[{ required: true }]}>
            <RangePicker size="large" className="w-full" />
          </Form.Item>
          <Form.Item name="usageLimit" label="Usage Limit (optional)">
            <InputNumber size="large" min={1} className="w-full" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            Create
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
