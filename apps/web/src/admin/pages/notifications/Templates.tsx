import { Button, Checkbox, Form, Input, Select, Table, message } from "antd";
import { useState } from "react";
import {
  useListNotificationTemplatesQuery,
  useUpsertNotificationTemplateMutation,
  type NotificationTemplate,
  type NotificationTemplateInput,
} from "../../../api/notificationsApi";

// T177 (US-Polish)
export default function Templates() {
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
      message.success("Template saved");
    } catch {
      message.error("Could not save the template");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Notification Templates</h1>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        onRow={(row) => ({ onClick: () => onEdit(row) })}
        scroll={{ x: true }}
        columns={[
          { title: "Key", dataIndex: "key" },
          { title: "Channel", dataIndex: "channel" },
          { title: "Active", dataIndex: "active", render: (v: boolean) => (v ? "Yes" : "No") },
        ]}
      />
      {editing && (
        <div className="mt-6 rounded border border-gray-200 p-4">
          <h2 className="mb-3 text-base font-medium">Edit: {editing.key}</h2>
          <Form<NotificationTemplateInput> form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="key" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="channel" label="Channel" rules={[{ required: true }]}>
              <Select size="large" options={["WHATSAPP", "SMS", "EMAIL"].map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="bodyAr" label="Body (Arabic)" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="bodyEn" label="Body (English)" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="active" valuePropName="checked">
              <Checkbox>Active</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={isSaving}>
              Save
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
}
