import { useState } from "react";
import { Button, Card, Form, Input, InputNumber, List, Select, message } from "antd";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const { data: subscription } = useGetSubscriptionQuery(id ?? "", { skip: isNew });
  const [createSubscription, { isLoading: isCreating }] = useCreateSubscriptionMutation();
  const [pauseSubscription] = usePauseSubscriptionMutation();
  const [resumeSubscription] = useResumeSubscriptionMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();

  const [form] = Form.useForm<SubscriptionFormValues>();
  const [phoneSearch, setPhoneSearch] = useState("");
  const { data: searchResults } = useSearchCustomersQuery({ search: phoneSearch }, { skip: !phoneSearch });
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
      message.success("Subscription created");
      navigate(`/admin/subscriptions/${created.id}`);
    } catch {
      message.error("Could not create the subscription");
    }
  }

  if (!isNew && subscription) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-4 text-xl font-semibold">Subscription</h1>
        <Card className="mb-6">
          <p>Frequency: {subscription.frequency}</p>
          <p>Price: {formatCurrency(subscription.priceSnapshot, "en")}</p>
          <p>Status: {subscription.status}</p>
          <div className="mt-4 flex gap-3">
            {subscription.status === "ACTIVE" && (
              <Button size="large" onClick={() => pauseSubscription(subscription.id)}>
                Pause
              </Button>
            )}
            {subscription.status === "PAUSED" && (
              <Button size="large" onClick={() => resumeSubscription(subscription.id)}>
                Resume
              </Button>
            )}
            {subscription.status !== "CANCELLED" && (
              <Button danger size="large" onClick={() => cancelSubscription(subscription.id)}>
                Cancel
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
      <h1 className="mb-4 text-xl font-semibold">New Subscription</h1>
      <Form<SubscriptionFormValues> form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item label="Customer" required>
          <Input.Search placeholder="Search by phone" size="large" onSearch={setPhoneSearch} />
          <List
            dataSource={searchResults?.items}
            renderItem={(c) => (
              <List.Item
                onClick={() => {
                  setCustomerId(c.userId);
                  form.setFieldValue("customerId", c.userId);
                }}
                className="cursor-pointer"
              >
                {c.fullName} — {c.phone} {customerId === c.userId ? "✓" : ""}
              </List.Item>
            )}
          />
        </Form.Item>
        <Form.Item name="customerId" rules={[{ required: true, message: "Select a customer" }]} hidden>
          <Input />
        </Form.Item>
        <Form.Item name="addressId" label="Address" rules={[{ required: true }]}>
          <Select
            size="large"
            disabled={!customerId}
            options={addresses?.map((a) => ({ value: a.id, label: `${a.city} — ${a.neighborhood}` }))}
          />
        </Form.Item>
        <Form.Item name="serviceId" label="Service" rules={[{ required: true }]}>
          <Select size="large" options={services?.map((s) => ({ value: s.id, label: s.nameEn }))} />
        </Form.Item>
        <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
          <Select size="large" options={FREQUENCIES.map((f) => ({ value: f, label: f }))} />
        </Form.Item>
        <Form.Item name="priceSnapshot" label="Price (SAR)" rules={[{ required: true }]}>
          <InputNumber size="large" min={0} className="w-full" />
        </Form.Item>
        <Form.Item name="startsAt" label="Starts On" rules={[{ required: true }]}>
          <Input type="date" size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
          Create Subscription
        </Button>
      </Form>
    </div>
  );
}
