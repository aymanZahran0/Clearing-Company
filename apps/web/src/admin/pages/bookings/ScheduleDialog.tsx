import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useListTimeSlotsQuery } from "../../../api/availabilityApi";
import { useScheduleBookingMutation } from "../../../api/bookingsApi";
import { SlotPicker } from "../../../components/SlotPicker";

interface ScheduleFormValues {
  timeSlotId: string;
  internalHandlingNote?: string;
}

// T114 (US4): planned time + internal note + capacity-conflict warning/override.
export function ScheduleDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: slots } = useListTimeSlotsQuery(undefined, { skip: !open });
  const [scheduleBooking, { isLoading }] = useScheduleBookingMutation();

  async function onFinish(values: ScheduleFormValues) {
    try {
      await scheduleBooking({ id: bookingId, ...values }).unwrap();
      setOpen(false);
      onDone?.();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button type="primary" size="large" onClick={() => setOpen(true)}>
        {t("admin:bookings.schedule")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:bookings.scheduleBooking")}>
        <Form<ScheduleFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="timeSlotId" label={t("admin:bookings.timeSlot")} rules={[{ required: true }]}>
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
            {t("admin:bookings.schedule")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
