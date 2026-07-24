import { Button, Form, Input, Result, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useGetBookingByReferenceQuery } from "../../api/bookingsApi";
import { formatDateTime } from "../../lib/formatters";
import { enumLabel } from "../../lib/enumLabels";

interface LookupFormValues {
  referenceNumber: string;
}

// Public, unauthenticated route (FR-077) — a booking reference alone is
// never sufficient; the verification token is required.
export default function PublicBookingLookup() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useState<LookupFormValues | null>(null);
  const { currentData, isFetching, isError } = useGetBookingByReferenceQuery(
    params?.referenceNumber ?? "",
    { skip: !params }
  );

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("customer:bookingLookup.title")}</h1>
      <Form<LookupFormValues>
        layout="vertical"
        onFinish={(values) =>
          setParams({ referenceNumber: values.referenceNumber.trim().toUpperCase() })
        }
        requiredMark={false}
      >
        <Form.Item
          name="referenceNumber"
          label={t("customer:bookingLookup.bookingReference")}
          rules={[{ required: true }]}
        >
          <Input size="large" autoComplete="off" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isFetching}>
          {t("common.confirm")}
        </Button>
      </Form>

      {isFetching && <Skeleton active className="mt-4" />}
      {!isFetching && isError && <Result status="error" title={t("common.error") as string} className="mt-4" />}
      {!isFetching && !isError && currentData && (
        <Result
          status="success"
          title={currentData.referenceNumber}
          subTitle={`${currentData.serviceName} — ${enumLabel("bookingStatus", currentData.status)}${
            currentData.scheduledStartAt ? ` — ${formatDateTime(currentData.scheduledStartAt, i18n.language)}` : ""
          }`}
          className="mt-4"
        />
      )}
    </div>
  );
}
