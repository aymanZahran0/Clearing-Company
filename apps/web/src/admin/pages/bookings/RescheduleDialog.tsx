import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useListTimeSlotsQuery } from "../../../api/availabilityApi";
import { useRescheduleBookingMutation } from "../../../api/bookingsApi";
import { SlotPicker } from "../../../components/SlotPicker";

interface RescheduleFormValues {
  timeSlotId: string;
  internalHandlingNote?: string;
  overrideCapacity?: boolean;
}

// T115 (US4): move an already-scheduled booking to a different time slot.
export function RescheduleDialog({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: slots } = useListTimeSlotsQuery(undefined, { skip: !open });
  const [rescheduleBooking, { isLoading }] = useRescheduleBookingMutation();

  const availableSlots = (slots ?? []).filter((slot) => slot.active);

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
              slots={availableSlots.map((slot) => ({
                id: slot.id,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                disabled: slot.bookedCount >= slot.capacity,
                spotsLabel: `(${slot.bookedCount}/${slot.capacity})`,
              }))}
            />
          </Form.Item>
          <Alert className="mb-4" type="warning" showIcon message={t("admin:bookings.overrideCapacityWarning")} />
          <Form.Item name="overrideCapacity" valuePropName="checked">
            <Checkbox>{t("admin:bookings.overrideCapacity")}</Checkbox>
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
