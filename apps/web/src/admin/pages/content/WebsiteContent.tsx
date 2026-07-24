import { useState } from "react";
import { Button, Checkbox, Form, Input, Modal, Select, Table, message } from "antd";
import { useTranslation } from "react-i18next";
import {
  useDeleteContentBlockMutation,
  useListAllContentBlocksQuery,
  useUpsertContentBlockMutation,
  type ContentBlockInput,
} from "../../../api/contentApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

// T173 (US-Polish)
export default function WebsiteContent() {
  const { t } = useTranslation();
  const { data, isLoading } = useListAllContentBlocksQuery();
  const [upsertBlock, { isLoading: isSaving }] = useUpsertContentBlockMutation();
  const [deleteBlock] = useDeleteContentBlockMutation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<Omit<ContentBlockInput, "titleEn">>();

  async function onFinish(values: Omit<ContentBlockInput, "titleEn">) {
    try {
      await upsertBlock({ ...values, titleEn: values.titleAr }).unwrap();
      setOpen(false);
      form.resetFields();
      message.success(t("admin:content.blockSaved"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin:content.websiteContentTitle")}</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          {t("admin:content.newOrUpdateBlock")}
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:content.key"), dataIndex: "key" },
          {
            title: t("admin:content.type"),
            dataIndex: "type",
            render: (value: string) => enumLabel("websiteContentBlockType", value),
          },
          { title: t("admin:content.titleAr"), dataIndex: "titleAr" },
          {
            title: t("admin:content.active"),
            dataIndex: "active",
            render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
          },
          {
            title: t("admin:common.actions"),
            render: (_: unknown, row: { id: string }) => (
              <Button danger size="small" onClick={() => deleteBlock(row.id)}>
                {t("admin:common.delete")}
              </Button>
            ),
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:content.contentBlock")}>
        <Form<Omit<ContentBlockInput, "titleEn">>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item name="key" label={t("admin:content.key")} rules={[{ required: true }]}>
            <Input size="large" placeholder="e.g. home_hero" />
          </Form.Item>
          <Form.Item name="type" label={t("admin:content.type")} rules={[{ required: true }]}>
            <Select size="large" options={enumOptions("websiteContentBlockType", ["PAGE", "SECTION"])} />
          </Form.Item>
          <Form.Item name="titleAr" label={t("admin:content.titleAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="bodyAr" label={t("admin:content.bodyAr")} rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="bodyEn" label={t("admin:content.bodyEn")} rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="active" valuePropName="checked" initialValue={true}>
            <Checkbox>{t("admin:content.active")}</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isSaving}>
            {t("admin:common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
