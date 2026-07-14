import { useState } from "react";
import { Button, Checkbox, Form, Input, Modal, Select, Table, message } from "antd";
import {
  useDeleteContentBlockMutation,
  useListAllContentBlocksQuery,
  useUpsertContentBlockMutation,
  type ContentBlockInput,
} from "../../../api/contentApi";

// T173 (US-Polish)
export default function WebsiteContent() {
  const { data, isLoading } = useListAllContentBlocksQuery();
  const [upsertBlock, { isLoading: isSaving }] = useUpsertContentBlockMutation();
  const [deleteBlock] = useDeleteContentBlockMutation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ContentBlockInput>();

  async function onFinish(values: ContentBlockInput) {
    try {
      await upsertBlock(values).unwrap();
      setOpen(false);
      form.resetFields();
      message.success("Content block saved");
    } catch {
      message.error("Could not save the content block");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Website Content</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          New / Update Block
        </Button>
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: "Key", dataIndex: "key" },
          { title: "Type", dataIndex: "type" },
          { title: "Title (EN)", dataIndex: "titleEn" },
          { title: "Active", dataIndex: "active", render: (v: boolean) => (v ? "Yes" : "No") },
          {
            title: "",
            render: (_: unknown, row: { id: string }) => (
              <Button danger size="small" onClick={() => deleteBlock(row.id)}>
                Delete
              </Button>
            ),
          },
        ]}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Content Block">
        <Form<ContentBlockInput> form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="key" label="Key" rules={[{ required: true }]}>
            <Input size="large" placeholder="e.g. home_hero" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select size="large" options={["PAGE", "SECTION"].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="titleAr" label="Title (Arabic)" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="titleEn" label="Title (English)" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="bodyAr" label="Body (Arabic)" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="bodyEn" label="Body (English)" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="active" valuePropName="checked" initialValue={true}>
            <Checkbox>Active</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isSaving}>
            Save
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
