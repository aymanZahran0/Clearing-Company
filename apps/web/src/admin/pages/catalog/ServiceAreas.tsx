import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Switch, Table, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useCreateServiceAreaMutation,
  useDeleteServiceAreaMutation,
  useListAllServiceAreasQuery,
  usePermanentlyDeleteServiceAreaMutation,
  useUpdateServiceAreaMutation,
  type ServiceAreaWritableFields,
} from "../../../api/serviceAreasApi";
import type { ServiceArea } from "../../../api/servicesApi";

export default function ServiceAreas() {
  const { t } = useTranslation();
  const { data, isLoading } = useListAllServiceAreasQuery();
  const [createServiceArea, { isLoading: isCreating }] = useCreateServiceAreaMutation();
  const [updateServiceArea] = useUpdateServiceAreaMutation();
  const [deleteServiceArea] = useDeleteServiceAreaMutation();
  const [permanentlyDeleteServiceArea] = usePermanentlyDeleteServiceAreaMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceArea | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(area: ServiceArea) {
    setEditing(area);
    setOpen(true);
  }

  async function onFinish(values: ServiceAreaWritableFields) {
    try {
      if (editing) {
        await updateServiceArea({ id: editing.id, body: values }).unwrap();
      } else {
        await createServiceArea(values).unwrap();
      }
      setOpen(false);
      message.success(t("catalog:areaSaved"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function toggleActive(area: ServiceArea) {
    try {
      if (area.active) {
        await deleteServiceArea(area.id).unwrap();
      } else {
        await updateServiceArea({ id: area.id, body: { active: true } }).unwrap();
      }
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function remove(area: ServiceArea) {
    try {
      await permanentlyDeleteServiceArea(area.id).unwrap();
      message.success(t("catalog:deleted"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("catalog:serviceAreasTitle")}</h1>
        <Button type="primary" size="large" onClick={openCreate}>
          {t("catalog:newServiceArea")}
        </Button>
      </div>
      <div className="rounded-2xl border border-[#EAF0EF] bg-white p-2 shadow-sm sm:p-3">
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data ?? []}
        scroll={{ x: true }}
        pagination={false}
        columns={[
          { title: t("admin:content.titleAr"), dataIndex: "nameAr" },
          { title: t("catalog:city"), dataIndex: "city" },
          { title: t("catalog:travelFeeSar"), dataIndex: "travelFee" },
          {
            title: t("admin:common.active"),
            dataIndex: "active",
            render: (v: boolean, row: ServiceArea) => (
              <Switch checked={v} onChange={() => toggleActive(row)} aria-label={t("admin:common.active") as string} />
            ),
          },
          {
            title: t("admin:common.actions"),
            render: (_: unknown, row: ServiceArea) => (
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
        onCancel={() => setOpen(false)}
        footer={null}
        title={editing ? t("catalog:editServiceArea") : t("catalog:newServiceArea")}
        destroyOnClose
      >
        <Form<ServiceAreaWritableFields>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={editing ?? { travelFee: 0 }}
        >
          <Form.Item name="nameAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="city" label={t("catalog:city")}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="travelFee" label={t("catalog:travelFeeSar")}>
            <InputNumber size="large" className="w-full" min={0} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isCreating}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
