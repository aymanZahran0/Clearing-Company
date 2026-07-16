import { useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import { useCancelBookingMutation } from "../../../api/bookingsApi";

interface CancelFormValues {
  reason: string;
}

// T115 (US4): no-fee cancellation (FR-040). Reused by the Customer's
// own-booking cancel action (customer/pages/BookingDetail.tsx) since the
// underlying endpoint and confirmation shape are identical for both roles.
export function CancelDialog({
  bookingId,
  onDone,
  triggerLabel,
}: {
  bookingId: string;
  onDone?: () => void;
  triggerLabel?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [cancelBooking, { isLoading }] = useCancelBookingMutation();

  async function onFinish(values: CancelFormValues) {
    try {
      await cancelBooking({ id: bookingId, reason: values.reason }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      message.error(t("admin:bookings.cancelError"));
    }
  }

  return (
    <>
      <Button danger size="large" onClick={() => setOpen(true)}>
        {triggerLabel ?? t("admin:bookings.cancelBooking")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:bookings.cancelBooking")}>
        <Form<CancelFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="reason"
            label={t("admin:bookings.cancellationReason")}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button danger type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:bookings.cancelBooking")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
