import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import {
  useCreateAddOnMutation,
  useDeleteAddOnMutation,
  useListAllAddOnsQuery,
  useUpdateAddOnMutation,
} from "../../../api/serviceAddOnsApi";
import { useListServicesQuery, type ServiceAddOn } from "../../../api/servicesApi";

interface FormValues {
  serviceId: string;
  nameAr: string;
  nameEn: string;
  pricingMode: ServiceAddOn["pricingMode"];
  unitPrice: number;
  durationImpactMinutes?: number;
}

// T047 (US4): create/edit/activate for ServiceAddOn, with per-service
// assignment via the serviceId Select.
export default function AddOns() {
  const { t } = useTranslation();
  const { data: services } = useListServicesQuery({ includeInactive: true });
  const { data, isLoading } = useListAllAddOnsQuery();
  const [createAddOn, { isLoading: isCreating }] = useCreateAddOnMutation();
  const [updateAddOn] = useUpdateAddOnMutation();
  const [deleteAddOn] = useDeleteAddOnMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceAddOn | null>(null);

  const serviceNameById = new Map((services ?? []).map((s) => [s.id, s.nameEn]));

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(addOn: ServiceAddOn) {
    setEditing(addOn);
    setOpen(true);
  }

  async function onFinish(values: FormValues) {
    const body = { ...values, unitPrice: Math.round(values.unitPrice * 100) };
    try {
      if (editing) {
        await updateAddOn({ id: editing.id, body }).unwrap();
      } else {
        await createAddOn(body).unwrap();
      }
      setOpen(false);
      message.success(t("catalog:addOnSaved"));
    } catch {
      message.error(t("catalog:addOnSaveError"));
    }
  }

  async function toggleActive(addOn: ServiceAddOn) {
    try {
      if (addOn.active) {
        await deleteAddOn(addOn.id).unwrap();
      } else {
        await updateAddOn({ id: addOn.id, body: { active: true } }).unwrap();
      }
    } catch {
      message.error(t("catalog:addOnSaveError"));
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("catalog:addOnsTitle")}</h1>
        <Button type="primary" size="large" onClick={openCreate}>
          {t("catalog:newAddOn")}
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:content.titleEn"), dataIndex: "nameEn" },
          { title: t("admin:content.titleAr"), dataIndex: "nameAr" },
          {
            title: t("admin:pricing.selectService"),
            render: (_: unknown, row: ServiceAddOn) => serviceNameById.get(row.serviceId) ?? "—",
          },
          {
            title: t("admin:common.active"),
            dataIndex: "active",
            render: (v: boolean) => <Tag>{v ? t("admin:common.active") : t("admin:common.disabled")}</Tag>,
          },
          {
            title: "",
            render: (_: unknown, row: ServiceAddOn) => (
              <div className="flex flex-wrap gap-2">
                <Button size="small" onClick={() => openEdit(row)}>
                  {t("catalog:edit")}
                </Button>
                <Button size="small" danger={row.active} onClick={() => toggleActive(row)}>
                  {row.active ? t("catalog:deactivate") : t("catalog:activate")}
                </Button>
              </div>
            ),
          },
        ]}
      />
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={editing ? t("catalog:editAddOn") : t("catalog:newAddOn")}
        destroyOnClose
      >
        <Form<FormValues>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={
            editing
              ? { ...editing, unitPrice: editing.unitPrice / 100 }
              : { pricingMode: "FIXED", durationImpactMinutes: 0 }
          }
        >
          <Form.Item name="serviceId" label={t("admin:pricing.selectService")} rules={[{ required: true }]}>
            <Select
              size="large"
              virtual={false}
              options={(services ?? []).map((s) => ({ value: s.id, label: s.nameEn }))}
            />
          </Form.Item>
          <Form.Item name="nameEn" label={t("admin:content.titleEn")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="nameAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="pricingMode" label={t("catalog:pricingMode")} rules={[{ required: true }]}>
            <Select
              size="large"
              virtual={false}
              options={["FIXED", "PER_QUANTITY"].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <Form.Item name="unitPrice" label={t("catalog:unitPriceSar")} rules={[{ required: true }]}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="durationImpactMinutes" label={t("catalog:durationImpactMinutes")}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
