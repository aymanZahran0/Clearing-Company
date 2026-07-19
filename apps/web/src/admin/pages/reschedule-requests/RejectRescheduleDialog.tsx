import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useRejectRescheduleRequestMutation } from "../../../api/rescheduleRequestsApi";

export function RejectRescheduleDialog({ requestId, onDone }: { requestId: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rejectRescheduleRequest, { isLoading }] = useRejectRescheduleRequestMutation();

  async function onFinish(values: { reason: string }) {
    try {
      await rejectRescheduleRequest({ id: requestId, reason: values.reason }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button danger size="small" onClick={() => setOpen(true)}>
        {t("admin:rescheduleRequests.reject")}
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={t("admin:rescheduleRequests.reject")}
      >
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="reason" label={t("admin:bookings.reason")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button danger htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:rescheduleRequests.reject")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
