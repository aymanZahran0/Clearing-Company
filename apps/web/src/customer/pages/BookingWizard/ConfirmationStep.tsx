import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Result, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../../app/store";
import { resetWizard } from "../../../features/bookingWizard/wizardSlice";
import { useCreateBookingMutation } from "../../../api/bookingsApi";
import { getOrCreateIdempotencyKey, clearIdempotencyKey } from "../../../lib/idempotency";

interface ConfirmationValues {
  contactName: string;
  contactPhone: string;
  consentAccepted: boolean;
}

export function ConfirmationStep({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const [createBooking, { isLoading }] = useCreateBookingMutation();
  const [reference, setReference] = useState<string | null>(null);

  async function onFinish(values: ConfirmationValues) {
    if (!wizard.quoteId || !wizard.addressId || !wizard.propertyType || !wizard.requestedDate) return;

    const idempotencyKey = getOrCreateIdempotencyKey("booking-wizard");
    try {
      const booking = await createBooking({
        body: {
          quoteId: wizard.quoteId,
          addressId: wizard.addressId,
          propertyType: wizard.propertyType,
          propertyDetails: {
            rooms: wizard.rooms,
            areaSqm: wizard.areaSqm,
            conditionModifiers: wizard.conditionModifiers,
          },
          preferredDate: wizard.requestedDate,
          preferredTimeSlotId: wizard.requestedTimeSlotId ?? undefined,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          consentAccepted: true,
        },
        idempotencyKey,
      }).unwrap();

      clearIdempotencyKey("booking-wizard");
      setReference(booking.referenceNumber);
      dispatch(resetWizard());
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  if (reference) {
    const whatsappText = encodeURIComponent(t("customer:confirmationStep.whatsappMessage", { reference }));
    return (
      <Result
        status="success"
        title={reference}
        subTitle={t("customer:confirmationStep.submitted")}
        extra={[
          <a
            key="wa"
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button type="primary" size="large">
              {t("customer:confirmationStep.whatsapp")}
            </Button>
          </a>,
          <Button key="bookings" size="large" onClick={() => navigate("/bookings")}>
            {t("nav.bookings")}
          </Button>,
        ]}
      />
    );
  }

  return (
    <Form<ConfirmationValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
      <Form.Item name="contactName" label={t("auth.fullName")} rules={[{ required: true }]}>
        <Input size="large" />
      </Form.Item>
      <Form.Item name="contactPhone" label={t("auth.phone")} rules={[{ required: true }]}>
        <Input size="large" inputMode="tel" />
      </Form.Item>
      <Form.Item
        name="consentAccepted"
        valuePropName="checked"
        rules={[
          {
            validator: (_, v) =>
              v ? Promise.resolve() : Promise.reject(new Error(t("customer:confirmationStep.acceptTermsRequired"))),
          },
        ]}
      >
        <Checkbox>{t("customer:confirmationStep.acceptTerms")}</Checkbox>
      </Form.Item>
      {!wizard.quoteId && (
        <Alert type="warning" message={t("customer:confirmationStep.completePreviousSteps")} />
      )}
      <Space className="mt-4 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.cancel")}
        </Button>
        <Button type="primary" htmlType="submit" size="large" loading={isLoading}>
          {t("auth.submit")}
        </Button>
      </Space>
    </Form>
  );
}
