import { useState } from "react";
import { Button, Card, Form, Input, InputNumber, Select, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateSubscriptionMutation,
  useGetSubscriptionQuery,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCancelSubscriptionMutation,
  type SubscriptionFrequency,
} from "../../../api/subscriptionsApi";
import { useSearchCustomersQuery } from "../../../api/customersApi";
import { useListAddressesForCustomerQuery } from "../../../api/addressesApi";
import { useListServicesQuery } from "../../../api/servicesApi";
import { formatCurrency } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";
import { OccurrenceEditor } from "./OccurrenceEditor";

const FREQUENCIES: SubscriptionFrequency[] = ["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"];

interface SubscriptionFormValues {
  customerId: string;
  addressId: string;
  serviceId: string;
  frequency: SubscriptionFrequency;
  priceSnapshot: number;
  startsAt: string;
}

// T153 (US7): create screen when no :id param, else the existing
// subscription's detail/pause/resume/cancel + occurrence editor.
export default function SubscriptionEditor() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const { data: subscription } = useGetSubscriptionQuery(id ?? "", { skip: isNew });
  const [createSubscription, { isLoading: isCreating }] = useCreateSubscriptionMutation();
  const [pauseSubscription] = usePauseSubscriptionMutation();
  const [resumeSubscription] = useResumeSubscriptionMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();

  const [form] = Form.useForm<SubscriptionFormValues>();
  const { data: customersData, isFetching: isLoadingCustomers } = useSearchCustomersQuery({});
  const [customerId, setCustomerId] = useState<string | null>(null);
  const { data: addresses } = useListAddressesForCustomerQuery(customerId ?? "", { skip: !customerId });
  const { data: services } = useListServicesQuery();

  async function onFinish(values: SubscriptionFormValues) {
    try {
      const created = await createSubscription({
        customerId: values.customerId,
        addressId: values.addressId,
        serviceConfiguration: { serviceId: values.serviceId, addOnIds: [] },
        frequency: values.frequency,
        priceSnapshot: Math.round(values.priceSnapshot * 100),
        startsAt: values.startsAt,
      }).unwrap();
      message.success(t("admin:subscriptions.created"));
      navigate(`/admin/subscriptions/${created.id}`);
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  if (!isNew && subscription) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-4 text-xl font-semibold">{t("admin:subscriptions.subscriptionTitle")}</h1>
        <Card className="mb-6">
          <p>
            {t("admin:subscriptions.frequencyLabel", {
              value: enumLabel("subscriptionFrequency", subscription.frequency),
            })}
          </p>
          <p>
            {t("admin:subscriptions.priceLabel", {
              value: formatCurrency(subscription.priceSnapshot, i18n.language),
            })}
          </p>
          <p>
            {t("admin:subscriptions.statusLabel", { value: enumLabel("subscriptionStatus", subscription.status) })}
          </p>
          <div className="mt-4 flex gap-3">
            {subscription.status === "ACTIVE" && (
              <Button size="large" onClick={() => pauseSubscription(subscription.id)}>
                {t("admin:subscriptions.pause")}
              </Button>
            )}
            {subscription.status === "PAUSED" && (
              <Button size="large" onClick={() => resumeSubscription(subscription.id)}>
                {t("admin:subscriptions.resume")}
              </Button>
            )}
            {subscription.status !== "CANCELLED" && (
              <Button danger size="large" onClick={() => cancelSubscription(subscription.id)}>
                {t("admin:subscriptions.cancel")}
              </Button>
            )}
          </div>
        </Card>
        <OccurrenceEditor subscriptionId={subscription.id} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:subscriptions.newSubscription")}</h1>
      <Form<SubscriptionFormValues> form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="customerId"
          label={t("admin:subscriptions.customer")}
          rules={[{ required: true, message: t("admin:subscriptions.selectCustomer") }]}
        >
          <Select
            size="large"
            loading={isLoadingCustomers}
            placeholder={t("admin:subscriptions.selectCustomer")}
            onChange={(value: string) => setCustomerId(value)}
            options={customersData?.items.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.phone}` }))}
          />
        </Form.Item>
        <Form.Item name="addressId" label={t("admin:subscriptions.address")} rules={[{ required: true }]}>
          <Select
            size="large"
            disabled={!customerId}
            options={addresses?.map((a) => ({ value: a.id, label: `${a.city} — ${a.neighborhood}` }))}
          />
        </Form.Item>
        <Form.Item name="serviceId" label={t("admin:subscriptions.service")} rules={[{ required: true }]}>
          <Select
            size="large"
            options={services?.map((s) => ({ value: s.id, label: s.nameAr }))}
          />
        </Form.Item>
        <Form.Item name="frequency" label={t("admin:subscriptions.frequency")} rules={[{ required: true }]}>
          <Select size="large" options={enumOptions("subscriptionFrequency", FREQUENCIES)} />
        </Form.Item>
        <Form.Item name="priceSnapshot" label={t("admin:subscriptions.priceSar")} rules={[{ required: true }]}>
          <InputNumber size="large" min={0} className="w-full" />
        </Form.Item>
        <Form.Item name="startsAt" label={t("admin:subscriptions.startsOn")} rules={[{ required: true }]}>
          <Input type="date" size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
          {t("admin:subscriptions.createSubscription")}
        </Button>
      </Form>
    </div>
  );
}
