import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Table, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useListAllCategoriesQuery,
  useUpdateCategoryMutation,
  type ServiceCategoryWritableFields,
} from "../../../api/serviceCategoriesApi";
import type { ServiceCategory } from "../../../api/servicesApi";

// T045 (US4): create/edit/reorder/deactivate for ServiceCategory.
// Reorder swaps sortOrder with the adjacent row rather than a dedicated
// bulk-reorder endpoint, since sortOrder is already writable via the
// existing PATCH /service-categories/:id.
export default function Categories() {
  const { t } = useTranslation();
  const { data, isLoading } = useListAllCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);

  const sorted = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(category: ServiceCategory) {
    setEditing(category);
    setOpen(true);
  }

  async function onFinish(values: ServiceCategoryWritableFields) {
    try {
      if (editing) {
        await updateCategory({ id: editing.id, body: values }).unwrap();
      } else {
        await createCategory(values).unwrap();
      }
      setOpen(false);
      message.success(t("catalog:categorySaved"));
    } catch (err) {
      const status = (err as { status?: number })?.status;
      message.error(status === 409 ? t("catalog:slugExists") : t("catalog:categorySaveError"));
    }
  }

  async function toggleActive(category: ServiceCategory) {
    try {
      if (category.active) {
        await deleteCategory(category.id).unwrap();
      } else {
        await updateCategory({ id: category.id, body: { active: true } }).unwrap();
      }
    } catch {
      message.error(t("catalog:categorySaveError"));
    }
  }

  async function move(category: ServiceCategory, direction: -1 | 1) {
    const index = sorted.findIndex((c) => c.id === category.id);
    const neighbor = sorted[index + direction];
    if (!neighbor) return;
    await Promise.all([
      updateCategory({ id: category.id, body: { sortOrder: neighbor.sortOrder } }).unwrap(),
      updateCategory({ id: neighbor.id, body: { sortOrder: category.sortOrder } }).unwrap(),
    ]).catch(() => message.error(t("catalog:categorySaveError")));
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("catalog:categoriesTitle")}</h1>
        <Button type="primary" size="large" onClick={openCreate}>
          {t("catalog:newCategory")}
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={sorted}
        scroll={{ x: true }}
        pagination={false}
        columns={[
          { title: t("admin:content.titleEn"), dataIndex: "nameEn" },
          { title: t("admin:content.titleAr"), dataIndex: "nameAr" },
          { title: t("catalog:slug"), dataIndex: "slug" },
          {
            title: t("admin:common.active"),
            dataIndex: "active",
            render: (v: boolean) => <Tag>{v ? t("admin:common.active") : t("admin:common.disabled")}</Tag>,
          },
          {
            title: "",
            render: (_: unknown, row: ServiceCategory) => (
              <div className="flex flex-wrap gap-2">
                <Button size="small" onClick={() => move(row, -1)}>
                  {t("catalog:moveUp")}
                </Button>
                <Button size="small" onClick={() => move(row, 1)}>
                  {t("catalog:moveDown")}
                </Button>
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
        title={editing ? t("catalog:editCategory") : t("catalog:newCategory")}
        destroyOnClose
      >
        <Form<ServiceCategoryWritableFields>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={editing ?? { sortOrder: 0 }}
        >
          <Form.Item name="nameEn" label={t("admin:content.titleEn")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="nameAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="slug" label={t("catalog:slug")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="sortOrder" label={t("catalog:sortOrder")}>
            <InputNumber size="large" className="w-full" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
