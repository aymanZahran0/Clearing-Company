import { useState } from "react";
import { Alert, Button, Form, Input, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import { useReactivateCustomerMutation } from "../../../api/customersApi";

interface ReactivateFormValues {
  reason?: string;
}

// US5 scenario 9/FR-017a: a 409 (not currently suspended — a concurrent
// Admin already reactivated it) surfaces as a clear message.
export function ReactivateCustomerDialog({
  customerId,
  onDone,
  triggerSize = "large",
}: {
  customerId: string;
  onDone?: () => void;
  triggerSize?: "small" | "large";
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reactivateCustomer, { isLoading }] = useReactivateCustomerMutation();

  async function onFinish(values: ReactivateFormValues) {
    try {
      await reactivateCustomer({ id: customerId, reason: values.reason }).unwrap();
      setOpen(false);
      message.success(t("admin:customers.reactivated"));
      onDone?.();
    } catch (err) {
      // A concurrent Admin already reactivated this customer; treat it like
      // success since the end state is what the user wanted.
      const apiError = err as { status?: number; data?: { error?: { code?: string } } };
      if (apiError.status === 409 && apiError.data?.error?.code === "CUSTOMER_NOT_SUSPENDED") {
        onDone?.();
      }
    }
  }

  return (
    <>
      <Button size={triggerSize} onClick={() => setOpen(true)}>
        {t("admin:customers.reactivate")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:customers.reactivateTitle")}>
        <Alert className="mb-4" type="info" showIcon message={t("admin:customers.reactivateConfirmBody")} />
        <Form<ReactivateFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="reason" label={t("admin:customers.reactivateReasonLabel")}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:customers.reactivate")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
