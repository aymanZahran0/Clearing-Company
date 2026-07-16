import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Modal, Select, message } from "antd";
import { useTranslation } from "react-i18next";
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
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        message.error(t("admin:bookings.capacityConflict"));
      } else {
        message.error(t("admin:bookings.rescheduleError"));
      }
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
            <Select
              size="large"
              options={availableSlots.map((slot) => ({
                value: slot.id,
                label: `${formatDateTime(slot.date, "en")} ${slot.startTime}–${slot.endTime} (${slot.bookedCount}/${slot.capacity})`,
                disabled: slot.bookedCount >= slot.capacity,
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
