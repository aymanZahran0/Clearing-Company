import { useState } from "react";
import { Button, Card, Form, Input, List, Select, Steps, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  useCreateCustomerMutation,
  useSearchCustomersQuery,
  type CustomerSummary,
} from "../../../api/customersApi";
import { useCreateAddressForCustomerMutation } from "../../../api/addressesApi";
import { useListServiceAreasQuery, useListServicesQuery } from "../../../api/servicesApi";
import { useEstimateQuoteMutation } from "../../../api/quotesApi";
import { useCreateAdminBookingMutation } from "../../../api/bookingsApi";
import { formatCurrency } from "../../../lib/formatters";
import { enumOptions } from "../../../lib/enumOptions";
import { createSaudiMobileSchema } from "../../../lib/validation";

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "OFFICE", "SHOP", "CLINIC", "FURNISHED_UNIT", "OTHER"];

/**
 * Single-screen equivalent of the Customer Portal's Booking Wizard,
 * fulfilling User Story 2 (spec.md): Admin completes every step on behalf
 * of a phone/WhatsApp caller who never touches the website (FR-018).
 */
export default function NewPhoneBooking() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const phoneSchema = createSaudiMobileSchema(t("auth.phoneRequired"), t("auth.phoneInvalid"));

  // Step 1: customer
  const [phoneSearch, setPhoneSearch] = useState("");
  const { data: searchResults, isFetching: isLoadingCustomers } = useSearchCustomersQuery({
    search: phoneSearch || undefined,
    pageSize: 100,
  });
  const [createCustomer] = useCreateCustomerMutation();
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);

  // Steps 2 and 3: location, then service + schedule
  const { data: services } = useListServicesQuery();
  const { data: areas } = useListServiceAreasQuery();
  const [createAddress] = useCreateAddressForCustomerMutation();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [requestedDate, setRequestedDate] = useState<string | null>(null);

  // Step 3: quote + confirm
  const [estimateQuote, { data: quote }] = useEstimateQuoteMutation();
  const [createBooking, { isLoading: isSubmitting }] = useCreateAdminBookingMutation();

  async function handleCreateNewCustomer(values: { fullName: string; phone: string }) {
    const created = await createCustomer(values).unwrap();
    setCustomer(created);
    setStep(1);
  }

  async function handleCreateAddress(values: {
    city: string;
    neighborhood: string;
    serviceAreaId: string;
  }) {
    if (!customer) return;
    const address = await createAddress({ customerId: customer.id, body: values }).unwrap();
    setAddressId(address.id);
    setStep(2);
  }

  async function handleGetQuote(values: { requestedDate: string; propertyType: string }) {
    if (!serviceId || !addressId) return;
    setPropertyType(values.propertyType);
    setRequestedDate(values.requestedDate);
    await estimateQuote({
      serviceId,
      addOnIds: [],
      propertyType: values.propertyType,
      propertySizeInput: { conditionModifiers: [] },
      addressId,
      requestedDate: values.requestedDate,
    }).unwrap();
    setStep(3);
  }

  async function handleSubmit() {
    if (!customer || !addressId || !quote || !propertyType || !requestedDate) return;
    try {
      const booking = await createBooking({
        body: {
          customerId: customer.id,
          quoteId: quote.id,
          addressId,
          propertyType,
          preferredDate: requestedDate,
          contactName: customer.fullName,
          contactPhone: customer.phone ?? "",
          consentAccepted: true,
        },
      }).unwrap();
      message.success(booking.referenceNumber);
      navigate(`/admin/bookings/${booking.id}`);
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:bookings.newPhoneBooking")}</h1>
      <Steps
        current={step}
        items={[
          { title: t("admin:bookings.customerStepTitle") },
          { title: t("admin:bookings.locationStepTitle") },
          { title: t("admin:bookings.serviceAddressStepTitle") },
          { title: t("admin:bookings.confirmStepTitle") },
        ]}
        className="mb-6"
      />

      {step === 0 && (
        <Card>
          <Input.Search
            placeholder={t("admin:bookings.searchByPhonePlaceholder")}
            size="large"
            value={phoneSearch}
            onChange={(event) => setPhoneSearch(event.target.value)}
            onSearch={setPhoneSearch}
            allowClear
            className="mb-4"
          />
          <List
            dataSource={searchResults?.items}
            loading={isLoadingCustomers}
            renderItem={(c) => (
              <List.Item
                onClick={() => {
                  setCustomer(c);
                  setStep(1);
                }}
                className="cursor-pointer"
              >
                {c.fullName} — {c.phone}
              </List.Item>
            )}
          />
          <div className="mt-6 border-t pt-4">
            <h2 className="mb-2 text-base font-medium">{t("admin:bookings.orCreateNewCustomer")}</h2>
            <Form layout="vertical" onFinish={handleCreateNewCustomer} requiredMark={false}>
              <Form.Item name="fullName" label={t("auth.fullName")} rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
                label={t("auth.phone")}
                normalize={(value: string) => value.replace(/\D/g, "").slice(0, 10)}
                rules={[
                  {
                    validator: async (_, value) => {
                      await phoneSchema.validate(value);
                    },
                  },
                ]}
              >
                <Input size="large" inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="05XXXXXXXX" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                {t("common.confirm")}
              </Button>
            </Form>
          </div>
        </Card>
      )}

      {step === 1 && customer && (
        <Card title={`${customer.fullName} — ${customer.phone}`}>
          <Form layout="vertical" onFinish={handleCreateAddress} requiredMark={false}>
            <Form.Item
              name="serviceAreaId"
              label={t("customer:addressStep.serviceArea")}
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                options={areas?.map((a) => ({
                  value: a.id,
                  label: i18n.language.startsWith("ar") ? a.nameAr : a.nameEn,
                }))}
              />
            </Form.Item>
            <Form.Item name="city" label={t("customer:addressStep.city")} rules={[{ required: true }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="neighborhood"
              label={t("customer:addressStep.neighborhood")}
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              {t("common.confirm")}
            </Button>
          </Form>
        </Card>
      )}

      {step === 2 && customer && addressId && (
        <Card title={`${customer.fullName} — ${customer.phone}`}>
          <Form layout="vertical" onFinish={handleGetQuote} requiredMark={false}>
            <Form.Item name="propertyType" label={t("admin:bookings.propertyType")} rules={[{ required: true }]}>
              <Select size="large" options={enumOptions("propertyType", PROPERTY_TYPES)} />
            </Form.Item>
            <Form.Item
              name="requestedDate"
              label={t("admin:bookings.requestedDate")}
              rules={[{ required: true }]}
            >
              <Input type="date" size="large" />
            </Form.Item>
            <Form.Item
              name="serviceId"
              label={t("admin:bookings.service")}
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                onChange={setServiceId}
                options={services?.map((s) => ({
                  value: s.id,
                  label: s.nameAr,
                }))}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block disabled={!serviceId}>
              {t("common.confirm")}
            </Button>
          </Form>
        </Card>
      )}

      {step === 3 && quote && (
        <Card>
          <p className="mb-4 text-lg font-semibold">
            {formatCurrency(quote.priceBreakdownJson.total, i18n.language)}
          </p>
          <Button
            type="primary"
            size="large"
            block
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {t("common.confirm")}
          </Button>
        </Card>
      )}
    </div>
  );
}
