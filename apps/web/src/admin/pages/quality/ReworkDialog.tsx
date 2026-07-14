import { useState } from "react";
import { Button, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useCreateReworkBookingMutation } from "../../../api/qualityIssuesApi";

// T142 (US6): FR-053 — creates a linked rework booking with no re-entry of
// customer/address/service details, then navigates straight to it.
export function ReworkDialog({ qualityIssueId }: { qualityIssueId: string }) {
  const [open, setOpen] = useState(false);
  const [createReworkBooking, { isLoading }] = useCreateReworkBookingMutation();
  const navigate = useNavigate();

  async function onConfirm() {
    try {
      const booking = await createReworkBooking(qualityIssueId).unwrap();
      setOpen(false);
      navigate(`/admin/bookings/${booking.id}`);
    } catch {
      message.error("Could not create a rework booking");
    }
  }

  return (
    <>
      <Button size="large" onClick={() => setOpen(true)}>
        Create Rework Booking
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onConfirm}
        confirmLoading={isLoading}
        title="Create Rework Booking"
        okText="Create"
      >
        <p>
          This creates a new complimentary booking linked to the original, reusing the same customer,
          address, and service — no re-entry required.
        </p>
      </Modal>
    </>
  );
}
