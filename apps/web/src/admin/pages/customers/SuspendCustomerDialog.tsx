import { useState } from "react";
import { Alert, Button, Form, Input, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import { useSuspendCustomerMutation } from "../../../api/customersApi";

interface SuspendFormValues {
  reason: string;
}

// US5 scenario 6/FR-017a: reason is required and destructive confirmation
// is explicit. A 409 (already suspended — a concurrent Admin got there
// first) surfaces as a clear message rather than a generic error.
export function SuspendCustomerDialog({
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
  const [suspendCustomer, { isLoading }] = useSuspendCustomerMutation();

  async function onFinish(values: SuspendFormValues) {
    try {
      await suspendCustomer({ id: customerId, reason: values.reason }).unwrap();
      setOpen(false);
      message.success(t("admin:customers.suspended"));
      onDone?.();
    } catch (err) {
      // A concurrent Admin already suspended this customer; treat it like
      // success since the end state is what the user wanted.
      const apiError = err as { status?: number; data?: { error?: { code?: string } } };
      if (apiError.status === 409 && apiError.data?.error?.code === "CUSTOMER_ALREADY_SUSPENDED") {
        onDone?.();
      }
    }
  }

  return (
    <>
      <Button danger size={triggerSize} onClick={() => setOpen(true)}>
        {t("admin:customers.suspend")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:customers.suspendTitle")}>
        <Alert className="mb-4" type="warning" showIcon message={t("admin:customers.suspendConfirmBody")} />
        <Form<SuspendFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="reason"
            label={t("admin:customers.suspendReasonLabel")}
            rules={[{ required: true, min: 3, max: 500, message: t("admin:customers.suspendReasonRequired") }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button danger type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:customers.suspend")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
