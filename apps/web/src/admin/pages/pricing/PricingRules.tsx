import { useState } from "react";
import { Button, Form, InputNumber, Modal, Select, Table, message } from "antd";
import { useListServicesQuery } from "../../../api/servicesApi";
import {
  useCreatePricingRuleMutation,
  useDeletePricingRuleMutation,
  useListPricingRulesQuery,
} from "../../../api/pricingRulesApi";

interface FormValues {
  ruleType: "PROPERTY_TYPE" | "AREA_BAND" | "DAY_TIME" | "CONDITION_MODIFIER";
  calculationType: "PERCENTAGE" | "FIXED_AMOUNT";
  amount: number;
  priority?: number;
}

// T176 (US-Polish): backend CRUD already existed from Phase 3 (T058) —
// this adds the missing Admin UI.
export default function PricingRules() {
  const { data: services } = useListServicesQuery();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const { data: rules, isLoading } = useListPricingRulesQuery(serviceId ?? "", { skip: !serviceId });
  const [createRule, { isLoading: isCreating }] = useCreatePricingRuleMutation();
  const [deleteRule] = useDeletePricingRuleMutation();
  const [open, setOpen] = useState(false);

  async function onFinish(values: FormValues) {
    if (!serviceId) return;
    try {
      await createRule({ serviceId, conditionsJson: {}, ...values }).unwrap();
      setOpen(false);
      message.success("Pricing rule created");
    } catch {
      message.error("Could not create the pricing rule");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Pricing Rules</h1>
      <Select
        placeholder="Select a service"
        size="large"
        className="mb-4 w-full sm:w-64"
        options={services?.map((s) => ({ value: s.id, label: s.nameEn }))}
        onChange={setServiceId}
      />
      {serviceId && (
        <>
          <Button type="primary" className="mb-4" onClick={() => setOpen(true)}>
            New Rule
          </Button>
          <Table
            loading={isLoading}
            rowKey="id"
            dataSource={rules}
            scroll={{ x: true }}
            columns={[
              { title: "Rule Type", dataIndex: "ruleType" },
              { title: "Calculation", dataIndex: "calculationType" },
              { title: "Amount", dataIndex: "amount" },
              { title: "Priority", dataIndex: "priority" },
              {
                title: "",
                render: (_: unknown, row: { id: string }) => (
                  <Button danger size="small" onClick={() => deleteRule(row.id)}>
                    Delete
                  </Button>
                ),
              },
            ]}
          />
        </>
      )}
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="New Pricing Rule">
        <Form<FormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="ruleType" label="Rule Type" rules={[{ required: true }]}>
            <Select
              size="large"
              options={["PROPERTY_TYPE", "AREA_BAND", "DAY_TIME", "CONDITION_MODIFIER"].map((t) => ({
                value: t,
                label: t,
              }))}
            />
          </Form.Item>
          <Form.Item name="calculationType" label="Calculation Type" rules={[{ required: true }]}>
            <Select size="large" options={["PERCENTAGE", "FIXED_AMOUNT"].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber size="large" className="w-full" />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <InputNumber size="large" className="w-full" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            Create
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
