import { useState } from "react";
import { Button, Form, InputNumber, Modal, Select, Table, message } from "antd";
import { useTranslation } from "react-i18next";
import { useListServicesQuery } from "../../../api/servicesApi";
import {
  useCreatePricingRuleMutation,
  useDeletePricingRuleMutation,
  useListPricingRulesQuery,
} from "../../../api/pricingRulesApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

interface FormValues {
  ruleType: "PROPERTY_TYPE" | "AREA_BAND" | "DAY_TIME" | "CONDITION_MODIFIER";
  calculationType: "PERCENTAGE" | "FIXED_AMOUNT";
  amount: number;
  priority?: number;
}

// T176 (US-Polish): backend CRUD already existed from Phase 3 (T058) —
// this adds the missing Admin UI.
export default function PricingRules() {
  const { t, i18n } = useTranslation();
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
      message.success(t("admin:pricing.ruleCreated"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:pricing.rulesTitle")}</h1>
      <Select
        placeholder={t("admin:pricing.selectService")}
        size="large"
        className="mb-4 w-full sm:w-64"
        options={services?.map((s) => ({ value: s.id, label: i18n.language === "ar" ? s.nameAr : s.nameEn }))}
        onChange={setServiceId}
      />
      {serviceId && (
        <>
          <Button type="primary" className="mb-4" onClick={() => setOpen(true)}>
            {t("admin:pricing.newRule")}
          </Button>
          <Table
            loading={isLoading}
            rowKey="id"
            dataSource={rules}
            scroll={{ x: true }}
            columns={[
              {
                title: t("admin:pricing.ruleType"),
                dataIndex: "ruleType",
                render: (value: string) => enumLabel("pricingRuleType", value),
              },
              {
                title: t("admin:pricing.calculation"),
                dataIndex: "calculationType",
                render: (value: string) => enumLabel("calculationType", value),
              },
              { title: t("admin:pricing.amount"), dataIndex: "amount" },
              { title: t("admin:pricing.priority"), dataIndex: "priority" },
              {
                title: "",
                render: (_: unknown, row: { id: string }) => (
                  <Button danger size="small" onClick={() => deleteRule(row.id)}>
                    {t("admin:common.delete")}
                  </Button>
                ),
              },
            ]}
          />
        </>
      )}
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:pricing.newRule")}>
        <Form<FormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="ruleType" label={t("admin:pricing.ruleType")} rules={[{ required: true }]}>
            <Select
              size="large"
              options={enumOptions("pricingRuleType", [
                "PROPERTY_TYPE",
                "AREA_BAND",
                "DAY_TIME",
                "CONDITION_MODIFIER",
              ])}
            />
          </Form.Item>
          <Form.Item name="calculationType" label={t("admin:pricing.calculationType")} rules={[{ required: true }]}>
            <Select size="large" options={enumOptions("calculationType", ["PERCENTAGE", "FIXED_AMOUNT"])} />
          </Form.Item>
          <Form.Item name="amount" label={t("admin:pricing.amount")} rules={[{ required: true }]}>
            <InputNumber size="large" className="w-full" />
          </Form.Item>
          <Form.Item name="priority" label={t("admin:pricing.priority")}>
            <InputNumber size="large" className="w-full" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.create")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
