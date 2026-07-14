import { useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
import { useRejectBookingMutation } from "../../../api/bookingsApi";

export function RejectDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [rejectBooking, { isLoading }] = useRejectBookingMutation();

  async function onFinish(values: { reason: string }) {
    try {
      await rejectBooking({ id: bookingId, reason: values.reason }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      message.error("Could not reject this booking");
    }
  }

  return (
    <>
      <Button danger size="large" onClick={() => setOpen(true)}>
        Reject Booking
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Reject Booking">
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button danger htmlType="submit" size="large" block loading={isLoading}>
            Reject
          </Button>
        </Form>
      </Modal>
    </>
  );
}
