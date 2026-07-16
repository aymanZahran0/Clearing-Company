import { Button, Form, Input, Result, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useGetBookingByReferenceQuery } from "../../api/bookingsApi";
import { formatDateTime } from "../../lib/formatters";

interface LookupFormValues {
  referenceNumber: string;
  token: string;
}

// Public, unauthenticated route (FR-077) — a booking reference alone is
// never sufficient; the verification token is required.
export default function PublicBookingLookup() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useState<LookupFormValues | null>(null);
  const { data, isFetching, isError } = useGetBookingByReferenceQuery(
    params ? { referenceNumber: params.referenceNumber, token: params.token } : { referenceNumber: "", token: "" },
    { skip: !params }
  );

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("customer:bookingLookup.title")}</h1>
      <Form<LookupFormValues> layout="vertical" onFinish={setParams} requiredMark={false}>
        <Form.Item
          name="referenceNumber"
          label={t("customer:bookingLookup.bookingReference")}
          rules={[{ required: true }]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item name="token" label={t("customer:bookingLookup.verificationCode")} rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isFetching}>
          {t("common.confirm")}
        </Button>
      </Form>

      {isFetching && <Skeleton active className="mt-4" />}
      {isError && <Result status="error" title={t("common.error") as string} className="mt-4" />}
      {data && (
        <Result
          status="success"
          title={data.referenceNumber}
          subTitle={`${data.serviceName} — ${data.status}${
            data.scheduledStartAt ? ` — ${formatDateTime(data.scheduledStartAt, i18n.language)}` : ""
          }`}
          className="mt-4"
        />
      )}
    </div>
  );
}
