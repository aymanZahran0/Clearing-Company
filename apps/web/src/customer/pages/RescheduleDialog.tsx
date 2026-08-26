import { useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import { useListOwnAddressesQuery } from "../../api/addressesApi";
import { useGetAvailabilityQuery } from "../../api/availabilityApi";
import { useSubmitRescheduleRequestMutation } from "../../api/rescheduleRequestsApi";
import { SlotPicker } from "../../components/SlotPicker";
import type { Booking } from "../../api/bookingsApi";

interface RescheduleFormValues {
  timeSlotId: string;
  reason?: string;
}

// T104 (US10): lets the Customer request a new time for a confirmed,
// scheduled booking; Admin approves/rejects from the reschedule-requests
// queue (admin/pages/reschedule-requests/List.tsx) — this dialog only
// submits the request, it never changes the booking's schedule directly.
export function RescheduleDialog({ booking, onDone }: { booking: Booking; onDone?: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: addresses } = useListOwnAddressesQuery(undefined, { skip: !open });
  const address = addresses?.find((a) => a.id === booking.addressId);
  const serviceId = booking.items?.[0]?.serviceId;

  const { data: slots, isLoading } = useGetAvailabilityQuery(
    { serviceId: serviceId ?? "", serviceAreaId: address?.serviceAreaId ?? "" },
    { skip: !open || !serviceId || !address }
  );

  const [submitRescheduleRequest, { isLoading: isSubmitting }] = useSubmitRescheduleRequestMutation();

  async function onFinish(values: RescheduleFormValues) {
    const slot = slots?.find((s) => s.id === values.timeSlotId);
    if (!slot) return;
    try {
      await submitRescheduleRequest({
        bookingId: booking.id,
        requestedTimeSlotId: slot.id,
        requestedStartAt: `${slot.date.slice(0, 10)}T${slot.startTime}:00.000Z`,
        reason: values.reason,
      }).unwrap();
      message.success(t("customer:rescheduleDialog.submitted"));
      setOpen(false);
      onDone?.();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button size="large" onClick={() => setOpen(true)}>
        {t("customer:rescheduleDialog.requestReschedule")}
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={t("customer:rescheduleDialog.requestReschedule")}
      >
        <Form<RescheduleFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="timeSlotId"
            label={t("customer:rescheduleDialog.newTimeSlot")}
            rules={[{ required: true }]}
          >
            <SlotPicker
              loading={isLoading}
              slots={(slots ?? []).map((slot) => ({
                id: slot.id,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
              }))}
            />
          </Form.Item>
          <Form.Item name="reason" label={t("customer:rescheduleDialog.reasonOptional")}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
            {t("customer:rescheduleDialog.submit")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
