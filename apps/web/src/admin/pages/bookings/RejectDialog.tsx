import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useRejectBookingMutation } from "../../../api/bookingsApi";

export function RejectDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rejectBooking, { isLoading }] = useRejectBookingMutation();

  async function onFinish(values: { reason: string }) {
    try {
      await rejectBooking({ id: bookingId, reason: values.reason }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button danger size="large" onClick={() => setOpen(true)}>
        {t("admin:bookings.rejectBooking")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:bookings.rejectBooking")}>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="reason" label={t("admin:bookings.reason")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button danger htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:bookings.reject")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
