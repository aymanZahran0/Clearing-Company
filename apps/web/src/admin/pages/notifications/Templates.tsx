import { Button, Checkbox, Form, Input, Select, Table, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useListNotificationTemplatesQuery,
  useUpsertNotificationTemplateMutation,
  type NotificationTemplate,
  type NotificationTemplateInput,
} from "../../../api/notificationsApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

// T177 (US-Polish)
export default function Templates() {
  const { t } = useTranslation();
  const { data, isLoading } = useListNotificationTemplatesQuery();
  const [upsertTemplate, { isLoading: isSaving }] = useUpsertNotificationTemplateMutation();
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form] = Form.useForm<NotificationTemplateInput>();

  function onEdit(template: NotificationTemplate) {
    setEditing(template);
    form.setFieldsValue(template);
  }

  async function onFinish(values: NotificationTemplateInput) {
    try {
      await upsertTemplate(values).unwrap();
      setEditing(null);
      message.success(t("admin:notifications.templateSaved"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:notifications.templatesTitle")}</h1>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        onRow={(row) => ({ onClick: () => onEdit(row) })}
        scroll={{ x: true }}
        columns={[
          {
            title: t("admin:content.key"),
            dataIndex: "key",
            render: (value: string) => enumLabel("notificationTemplateKey", value),
          },
          {
            title: t("admin:notifications.channel"),
            dataIndex: "channel",
            render: (value: string) => enumLabel("notificationChannel", value),
          },
          {
            title: t("admin:content.active"),
            dataIndex: "active",
            render: (v: boolean) => (v ? t("common.yes") : t("common.no")),
          },
        ]}
      />
      {editing && (
        <div className="mt-6 rounded border border-gray-200 p-4">
          <h2 className="mb-3 text-base font-medium">
            {t("admin:notifications.editTemplate", { key: enumLabel("notificationTemplateKey", editing.key) })}
          </h2>
          <Form<NotificationTemplateInput> form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="key" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="channel" label={t("admin:notifications.channel")} rules={[{ required: true }]}>
              <Select size="large" options={enumOptions("notificationChannel", ["WHATSAPP", "SMS", "EMAIL"])} />
            </Form.Item>
            <Form.Item name="bodyAr" label={t("admin:content.bodyAr")} rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="bodyEn" label={t("admin:content.bodyEn")} rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="active" valuePropName="checked">
              <Checkbox>{t("admin:content.active")}</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={isSaving}>
              {t("admin:common.save")}
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
}
