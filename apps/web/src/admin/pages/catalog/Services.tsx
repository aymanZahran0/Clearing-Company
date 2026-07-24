import { useState } from "react";
import { Button, Form, Image, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tag, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useTranslation } from "react-i18next";
import { useListAllCategoriesQuery } from "../../../api/serviceCategoriesApi";
import {
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useListServicesQuery,
  usePermanentlyDeleteServiceMutation,
  useUploadServiceImageMutation,
  useUpdateServiceMutation,
  type Service,
} from "../../../api/servicesApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";
import { formatCurrency } from "../../../lib/formatters";

const PRICING_TYPES: Service["pricingType"][] = ["FIXED", "PROPERTY_SIZE", "HOURLY", "QUANTITY", "CUSTOM_QUOTE"];

interface FormValues {
  categoryId: string;
  nameAr: string;
  descriptionAr?: string;
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
  const [permanentlyDeleteService] = usePermanentlyDeleteServiceMutation();
  const [uploadServiceImage, { isLoading: isUploading }] = useUploadServiceImageMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageList, setImageList] = useState<UploadFile[]>([]);

  function openCreate() {
    setEditing(null);
    setImageFile(null);
    setImageList([]);
    setOpen(true);
  }

  function openEdit(svc: Service) {
    setEditing(svc);
    setImageFile(null);
    setImageList([]);
    setOpen(true);
  }

  async function onFinish(values: FormValues) {
    const body = {
      ...values,
      basePrice: values.basePrice != null ? Math.round(values.basePrice * 100) : null,
      minimumPrice: values.minimumPrice != null ? Math.round(values.minimumPrice * 100) : null,
    };
    try {
      let savedService: Service;
      if (editing) {
        savedService = await updateService({ id: editing.id, body }).unwrap();
      } else {
        savedService = await createService(body).unwrap();
      }
      if (imageFile) {
        await uploadServiceImage({
          serviceId: savedService.id,
          file: imageFile,
          altTextAr: values.nameAr,
          sortOrder: -((editing?.images.length ?? 0) + 1),
        }).unwrap();
      }
      setOpen(false);
      setImageFile(null);
      setImageList([]);
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

  async function remove(svc: Service) {
    try {
      await permanentlyDeleteService(svc.id).unwrap();
      message.success(t("catalog:deleted"));
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
          { title: t("admin:content.titleAr"), dataIndex: "nameAr" },
          {
            title: t("catalog:pricingType"),
            dataIndex: "pricingType",
            render: (value: string) => enumLabel("pricingType", value),
          },
          {
            title: t("catalog:basePriceSar"),
            dataIndex: "basePrice",
            render: (value: number | null) => (value != null ? formatCurrency(value, i18n.language) : "—"),
          },
          {
            title: t("admin:common.active"),
            dataIndex: "active",
            render: (v: boolean) => <Tag>{v ? t("admin:common.active") : t("admin:common.disabled")}</Tag>,
          },
          {
            title: t("admin:common.actions"),
            render: (_: unknown, row: Service) => (
              <div className="flex flex-wrap gap-2">
                <Button size="small" onClick={() => openEdit(row)}>
                  {t("catalog:edit")}
                </Button>
                <Button size="small" danger={row.active} onClick={() => toggleActive(row)}>
                  {row.active ? t("catalog:deactivate") : t("catalog:activate")}
                </Button>
                <Popconfirm
                  title={t("catalog:delete")}
                  description={t("catalog:deleteConfirm")}
                  okText={t("catalog:delete")}
                  cancelText={t("common.cancel")}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => remove(row)}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={t("catalog:delete")}
                    title={t("catalog:delete")}
                  />
                </Popconfirm>
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
          <Form.Item name="nameAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="descriptionAr" label={t("catalog:descriptionAr")}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label={t("catalog:serviceImage")}>
            {editing?.images[0] && imageList.length === 0 && (
              <div className="mb-3">
                <Image
                  src={editing.images[0].url}
                  alt={editing.images[0].altTextAr ?? editing.nameAr}
                  width={120}
                  height={80}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <Upload
              accept="image/jpeg,image/png,image/webp"
              beforeUpload={(file) => {
                setImageFile(file);
                setImageList([file]);
                return false;
              }}
              fileList={imageList}
              maxCount={1}
              onRemove={() => {
                setImageFile(null);
                setImageList([]);
              }}
            >
              <Button icon={<UploadOutlined />}>{t("catalog:chooseServiceImage")}</Button>
            </Upload>
            <div className="mt-2 text-sm text-muted">{t("catalog:serviceImageHint")}</div>
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
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating || isUploading}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
