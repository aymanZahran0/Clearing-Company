import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Select, message } from "antd";
import { useListTimeSlotsQuery } from "../../../api/availabilityApi";
import { useRescheduleBookingMutation } from "../../../api/bookingsApi";
import { formatDateTime } from "../../../lib/formatters";

interface RescheduleFormValues {
  timeSlotId: string;
  internalHandlingNote?: string;
  overrideCapacity?: boolean;
}

// T115 (US4): move an already-scheduled booking to a different time slot.
export function RescheduleDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: slots } = useListTimeSlotsQuery(undefined, { skip: !open });
  const [rescheduleBooking, { isLoading }] = useRescheduleBookingMutation();

  const availableSlots = (slots ?? []).filter((slot) => slot.active);

  async function onFinish(values: RescheduleFormValues) {
    try {
      await rescheduleBooking({ id: bookingId, ...values }).unwrap();
      setOpen(false);
      onDone?.();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        message.error("This time slot is at full capacity — check the override box to proceed anyway");
      } else {
        message.error("Could not reschedule this booking");
      }
    }
  }

  return (
    <>
      <Button size="large" onClick={() => setOpen(true)}>
        Reschedule
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Reschedule Booking">
        <Form<RescheduleFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="timeSlotId" label="New Time Slot" rules={[{ required: true }]}>
            <Select
              size="large"
              options={availableSlots.map((slot) => ({
                value: slot.id,
                label: `${formatDateTime(slot.date, "en")} ${slot.startTime}–${slot.endTime} (${slot.bookedCount}/${slot.capacity})`,
                disabled: slot.bookedCount >= slot.capacity,
              }))}
            />
          </Form.Item>
          <Alert
            className="mb-4"
            type="warning"
            showIcon
            message="If the selected slot is full, tick the override box below — it will be recorded in the audit log."
          />
          <Form.Item name="overrideCapacity" valuePropName="checked">
            <Checkbox>Override capacity for a full slot</Checkbox>
          </Form.Item>
          <Form.Item name="internalHandlingNote" label="Internal Handling Note (optional)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            Reschedule
          </Button>
        </Form>
      </Modal>
    </>
  );
}
