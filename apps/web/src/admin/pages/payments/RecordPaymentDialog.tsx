import { useState } from "react";
import { Button, Form, InputNumber, Modal, Select, Input } from "antd";
import { useTranslation } from "react-i18next";
import { useRecordPaymentMutation, type PaymentInput } from "../../../api/paymentsApi";
import { enumOptions } from "../../../lib/enumOptions";

const METHODS: PaymentInput["method"][] = ["CASH", "BANK_TRANSFER", "POS", "COMPLIMENTARY", "OTHER"];

export function RecordPaymentDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [recordPayment, { isLoading }] = useRecordPaymentMutation();

  async function onFinish(values: PaymentInput) {
    try {
      // The form collects whole SAR for a human-friendly input; the API
      // stores integer minor units (halalas) per data-model.md.
      await recordPayment({
        bookingId,
        body: { ...values, amount: Math.round(values.amount * 100) },
      }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button size="large" onClick={() => setOpen(true)}>
        {t("admin:payments.recordPayment")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:payments.recordPayment")}>
        <Form<PaymentInput> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="method" label={t("admin:payments.method")} rules={[{ required: true }]}>
            <Select size="large" options={enumOptions("paymentMethod", METHODS)} />
          </Form.Item>
          <Form.Item name="amount" label={t("admin:payments.amountSar")} rules={[{ required: true }]}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="reference" label={t("admin:payments.reference")}>
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
