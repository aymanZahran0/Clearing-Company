import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import { useListAllCategoriesQuery } from "../../../api/serviceCategoriesApi";
import {
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useListServicesQuery,
  useUpdateServiceMutation,
  type Service,
} from "../../../api/servicesApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

const PRICING_TYPES: Service["pricingType"][] = ["FIXED", "PROPERTY_SIZE", "HOURLY", "QUANTITY", "CUSTOM_QUOTE"];

interface FormValues {
  categoryId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  pricingType: Service["pricingType"];
  basePrice?: number;
  minimumPrice?: number;
  defaultDurationMinutes?: number;
  requiresManualQuote?: boolean;
}

// T046 (US4): create/edit/activate for Service. No reorder here (Service
// has no sortOrder column, unlike ServiceCategory — see Categories.tsx).
export default function Services() {
  const { t, i18n } = useTranslation();
  const { data: categories } = useListAllCategoriesQuery();
  const { data, isLoading } = useListServicesQuery({ includeInactive: true });
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(svc: Service) {
    setEditing(svc);
    setOpen(true);
  }

  async function onFinish(values: FormValues) {
    const body = {
      ...values,
      basePrice: values.basePrice != null ? Math.round(values.basePrice * 100) : null,
      minimumPrice: values.minimumPrice != null ? Math.round(values.minimumPrice * 100) : null,
    };
    try {
      if (editing) {
        await updateService({ id: editing.id, body }).unwrap();
      } else {
        await createService(body).unwrap();
      }
      setOpen(false);
      message.success(t("catalog:serviceSaved"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function toggleActive(svc: Service) {
    try {
      if (svc.active) {
        await deleteService(svc.id).unwrap();
      } else {
        await updateService({ id: svc.id, body: { active: true } }).unwrap();
      }
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("catalog:servicesTitle")}</h1>
        <Button type="primary" size="large" onClick={openCreate}>
          {t("catalog:newService")}
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
          { title: t("catalog:slug"), dataIndex: "slug" },
          {
            title: t("catalog:pricingType"),
            dataIndex: "pricingType",
            render: (value: string) => enumLabel("pricingType", value),
          },
          {
            title: t("admin:common.active"),
            dataIndex: "active",
            render: (v: boolean) => <Tag>{v ? t("admin:common.active") : t("admin:common.disabled")}</Tag>,
          },
          {
            title: "",
            render: (_: unknown, row: Service) => (
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
        title={editing ? t("catalog:editService") : t("catalog:newService")}
        destroyOnClose
      >
        <Form<FormValues>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={
            editing
              ? {
                  ...editing,
                  basePrice: editing.basePrice != null ? editing.basePrice / 100 : undefined,
                  minimumPrice: editing.minimumPrice != null ? editing.minimumPrice / 100 : undefined,
                }
              : { pricingType: "FIXED", defaultDurationMinutes: 60 }
          }
        >
          <Form.Item name="categoryId" label={t("catalog:category")} rules={[{ required: true }]}>
            <Select
              size="large"
              virtual={false}
              options={(categories ?? []).map((c) => ({
                value: c.id,
                label: i18n.language === "ar" ? c.nameAr : c.nameEn,
              }))}
            />
          </Form.Item>
          <Form.Item name="nameEn" label={t("admin:content.titleEn")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="nameAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="slug" label={t("catalog:slug")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="descriptionEn" label={t("catalog:descriptionEn")}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="descriptionAr" label={t("catalog:descriptionAr")}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="pricingType" label={t("catalog:pricingType")} rules={[{ required: true }]}>
            <Select size="large" virtual={false} options={enumOptions("pricingType", PRICING_TYPES)} />
          </Form.Item>
          <Form.Item name="basePrice" label={t("catalog:basePriceSar")}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="minimumPrice" label={t("catalog:minimumPriceSar")}>
            <InputNumber size="large" min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="defaultDurationMinutes" label={t("catalog:defaultDurationMinutes")}>
            <InputNumber size="large" min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="requiresManualQuote" label={t("catalog:requiresManualQuote")} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
