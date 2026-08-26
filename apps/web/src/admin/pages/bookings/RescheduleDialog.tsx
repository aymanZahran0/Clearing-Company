import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useListTimeSlotsQuery } from "../../../api/availabilityApi";
import { useRescheduleBookingMutation } from "../../../api/bookingsApi";
import { SlotPicker } from "../../../components/SlotPicker";

interface RescheduleFormValues {
  timeSlotId: string;
  internalHandlingNote?: string;
}

// T115 (US4): move an already-scheduled booking to a different time slot.
export function RescheduleDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: slots } = useListTimeSlotsQuery(undefined, { skip: !open });
  const [rescheduleBooking, { isLoading }] = useRescheduleBookingMutation();

  async function onFinish(values: RescheduleFormValues) {
    try {
      await rescheduleBooking({ id: bookingId, ...values }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button size="large" onClick={() => setOpen(true)}>
        {t("admin:bookings.reschedule")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:bookings.rescheduleBooking")}>
        <Form<RescheduleFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="timeSlotId" label={t("admin:bookings.newTimeSlot")} rules={[{ required: true }]}>
            <SlotPicker
              slots={(slots ?? []).map((slot) => ({
                id: slot.id,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
              }))}
            />
          </Form.Item>
          <Form.Item name="internalHandlingNote" label={t("admin:bookings.internalHandlingNoteOptional")}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:bookings.reschedule")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
