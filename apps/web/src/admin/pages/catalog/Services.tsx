import { useEffect, useState } from "react";
import { Button, Form, Image, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Upload, message } from "antd";
import { DeleteOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useTranslation } from "react-i18next";
import { useListAllCategoriesQuery } from "../../../api/serviceCategoriesApi";
import {
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useDeleteServiceImageMutation,
  useListServicesQuery,
  usePermanentlyDeleteServiceMutation,
  useUploadServiceImageMutation,
  useUpdateServiceMutation,
  type Service,
} from "../../../api/servicesApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";
import { formatCurrency } from "../../../lib/formatters";
import defaultServiceImage from "../../../assets/logo/logo-without-name.png";

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
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const [permanentlyDeleteService] = usePermanentlyDeleteServiceMutation();
  const [uploadServiceImage, { isLoading: isUploading }] = useUploadServiceImageMutation();
  const [deleteServiceImage, { isLoading: isDeletingImage }] = useDeleteServiceImageMutation();
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    setPreviewOpen(false);
    if (!imageFile) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  const isSaving = isCreating || isUpdating || isUploading;

  async function removeImage(imageId: string) {
    const serviceId = editing?.id;
    setDeletingImageId(imageId);
    try {
      await deleteServiceImage(imageId).unwrap();
      setEditing((current) => current && current.id === serviceId
        ? { ...current, images: [] }
        : current);
      message.success(t("catalog:serviceImageDeleted"));
    } catch {
      // Keep the image visible on failure; the global middleware shows the error.
    } finally {
      setDeletingImageId(null);
    }
  }

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
      <div className="rounded-2xl border border-[#EAF0EF] bg-white p-2 shadow-sm sm:p-3">
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          {
            title: t("admin:content.titleAr"),
            dataIndex: "nameAr",
            render: (value: string, row: Service) => (
              <div className="flex items-center gap-3">
                <Image
                  src={row.images[0]?.url || defaultServiceImage}
                  alt={row.images[0]?.altTextAr ?? value}
                  width={44}
                  height={44}
                  preview={false}
                  className={`shrink-0 rounded-lg ${row.images[0] ? "object-cover" : "bg-paper object-contain p-1"}`}
                />
                <span>{value}</span>
              </div>
            ),
          },
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
            render: (v: boolean, row: Service) => (
              <Switch checked={v} onChange={() => toggleActive(row)} aria-label={t("admin:common.active") as string} />
            ),
          },
          {
            title: t("admin:common.actions"),
            render: (_: unknown, row: Service) => (
              <div className="flex flex-wrap gap-2">
                <Button size="small" onClick={() => openEdit(row)}>
                  {t("catalog:edit")}
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
      </div>
      <Modal
        open={open}
        onCancel={() => { if (!isDeletingImage && !isSaving) setOpen(false); }}
        closable={!isDeletingImage && !isSaving}
        maskClosable={!isDeletingImage && !isSaving}
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
                label: i18n.language.startsWith("ar") ? c.nameAr : c.nameEn,
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
            {!!editing?.images.length && (
              <div className="mb-3 flex flex-wrap gap-4">
                {editing.images.slice(0, 1).map((image) => (
                  <div key={image.id} className="flex items-center gap-3">
                    <Image
                      src={image.url}
                      alt={image.altTextAr ?? editing.nameAr}
                      width={120}
                      height={80}
                      className="rounded-lg object-cover"
                    />

                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Upload
                disabled={isDeletingImage || isSaving}
                accept="image/jpeg,image/png,image/webp"
                beforeUpload={(file) => {
                  setImageFile(file);
                  setImageList([file]);
                  return false;
                }}
                fileList={imageList}
                showUploadList={false}
                maxCount={1}
                onRemove={() => {
                  setImageFile(null);
                  setImageList([]);
                }}
              >
                <Button icon={<UploadOutlined />}>{t("catalog:chooseServiceImage")}</Button>
              </Upload>
              {imageFile && (
                  <div className="ms-auto flex min-w-0 items-center gap-2 rounded-lg bg-[#F3F8F7] px-3 py-2">
                    <span className="min-w-0 max-w-48 truncate" title={imageFile.name}>{imageFile.name}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      aria-label={t("catalog:viewServiceImage")}
                      title={t("catalog:viewServiceImage")}
                      disabled={!previewUrl}
                      onClick={() => setPreviewOpen(true)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t("catalog:deleteServiceImage")}
                      title={t("catalog:deleteServiceImage")}
                      disabled={isDeletingImage || isSaving}
                      onClick={() => { setImageFile(null); setImageList([]); }}
                    />
                  </div>
              )}
              {!!editing?.images.length && (
                <Popconfirm
                  title={t("catalog:deleteServiceImage")}
                  description={t("catalog:deleteServiceImageConfirm")}
                  okText={t("catalog:delete")}
                  cancelText={t("common.cancel")}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => removeImage(editing.images[0]!.id)}
                  disabled={isDeletingImage || isSaving}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    className="mt-1"
                    aria-label={t("catalog:deleteServiceImage")}
                    title={t("catalog:deleteServiceImage")}
                    loading={deletingImageId === editing.images[0]?.id}
                    disabled={isDeletingImage || isSaving}
                  />
                </Popconfirm>
              )}
            </div>
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
          <Button type="primary" htmlType="submit" size="large" block loading={isSaving} disabled={isDeletingImage}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
      <Modal
        open={previewOpen && !!imageFile && open}
        onCancel={() => setPreviewOpen(false)}
        title={t("catalog:viewServiceImage")}
        footer={null}
      >
        <img src={previewUrl} alt={imageFile?.name ?? ""} className="max-h-[70vh] w-full object-contain" />
      </Modal>
    </div>
  );
}
