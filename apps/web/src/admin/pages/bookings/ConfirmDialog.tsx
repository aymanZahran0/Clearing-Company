import { useState } from "react";
import { Button, Form, InputNumber, Modal, Input, message } from "antd";
import { useConfirmBookingMutation } from "../../../api/bookingsApi";

interface ConfirmFormValues {
  priceOverride?: number;
  priceOverrideReason?: string;
}

export function ConfirmDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmBooking, { isLoading }] = useConfirmBookingMutation();

  async function onFinish(values: ConfirmFormValues) {
    // FR-021: a price override requires a reason (enforced server-side too).
    if (values.priceOverride != null && !values.priceOverrideReason) {
      message.error("A reason is required when overriding the price");
      return;
    }
    try {
      // Form collects whole SAR; API stores integer minor units (halalas).
      await confirmBooking({
        id: bookingId,
        priceOverride:
          values.priceOverride != null ? Math.round(values.priceOverride * 100) : undefined,
        priceOverrideReason: values.priceOverrideReason,
      }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      message.error("Could not confirm this booking");
    }
  }

  return (
    <>
      <Button type="primary" size="large" onClick={() => setOpen(true)}>
        Confirm Booking
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Confirm Booking">
        <Form<ConfirmFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="priceOverride" label="Price Override (SAR, optional)">
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="priceOverrideReason" label="Override Reason">
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            Confirm
          </Button>
        </Form>
      </Modal>
    </>
  );
}
