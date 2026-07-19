import { useState } from "react";
import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCreateReworkBookingMutation } from "../../../api/qualityIssuesApi";

// T142 (US6): FR-053 — creates a linked rework booking with no re-entry of
// customer/address/service details, then navigates straight to it.
export function ReworkDialog({ qualityIssueId }: { qualityIssueId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [createReworkBooking, { isLoading }] = useCreateReworkBookingMutation();
  const navigate = useNavigate();

  async function onConfirm() {
    try {
      const booking = await createReworkBooking(qualityIssueId).unwrap();
      setOpen(false);
      navigate(`/admin/bookings/${booking.id}`);
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <>
      <Button size="large" onClick={() => setOpen(true)}>
        {t("admin:quality.createReworkBooking")}
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onConfirm}
        confirmLoading={isLoading}
        title={t("admin:quality.createReworkBooking")}
        okText={t("admin:common.create")}
      >
        <p>{t("admin:quality.reworkExplanation")}</p>
      </Modal>
    </>
  );
}
