import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Switch, Table, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useListAllCategoriesQuery,
  usePermanentlyDeleteCategoryMutation,
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
  const [permanentlyDeleteCategory] = usePermanentlyDeleteCategoryMutation();
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
    } catch {
      // toast shown by the global RTK Query error middleware
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
      // toast shown by the global RTK Query error middleware
    }
  }

  async function remove(category: ServiceCategory) {
    try {
      await permanentlyDeleteCategory(category.id).unwrap();
      message.success(t("catalog:deleted"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function move(category: ServiceCategory, direction: -1 | 1) {
    const index = sorted.findIndex((c) => c.id === category.id);
    const neighbor = sorted[index + direction];
    if (!neighbor) return;
    await Promise.all([
      updateCategory({ id: category.id, body: { sortOrder: neighbor.sortOrder } }).unwrap(),
      updateCategory({ id: neighbor.id, body: { sortOrder: category.sortOrder } }).unwrap(),
    ]).catch(() => {
      // toast shown by the global RTK Query error middleware
    });
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("catalog:categoriesTitle")}</h1>
        <Button type="primary" size="large" onClick={openCreate}>
          {t("catalog:newCategory")}
        </Button>
      </div>
      <div className="rounded-2xl border border-[#EAF0EF] bg-white p-2 shadow-sm sm:p-3">
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={sorted}
        scroll={{ x: true }}
        pagination={false}
        columns={[
          { title: t("admin:content.titleAr"), dataIndex: "nameAr" },
          {
            title: t("admin:common.active"),
            dataIndex: "active",
            render: (v: boolean, row: ServiceCategory) => (
              <Switch checked={v} onChange={() => toggleActive(row)} aria-label={t("admin:common.active") as string} />
            ),
          },
          {
            title: t("admin:common.actions"),
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
          <Form.Item name="nameAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
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
