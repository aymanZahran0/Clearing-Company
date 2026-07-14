import { useState } from "react";
import { Button, Form, Input, List, Modal, message } from "antd";
import {
  useCreateFaqItemMutation,
  useDeleteFaqItemMutation,
  useListAllFaqsQuery,
  type FaqItemInput,
} from "../../../api/contentApi";

// T173 (US-Polish)
export default function FAQs() {
  const { data, isLoading } = useListAllFaqsQuery();
  const [createFaq, { isLoading: isSaving }] = useCreateFaqItemMutation();
  const [deleteFaq] = useDeleteFaqItemMutation();
  const [open, setOpen] = useState(false);

  async function onFinish(values: FaqItemInput) {
    try {
      await createFaq(values).unwrap();
      setOpen(false);
      message.success("FAQ item added");
    } catch {
      message.error("Could not add the FAQ item");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">FAQs</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          New FAQ
        </Button>
      </div>
      <List
        loading={isLoading}
        dataSource={data}
        renderItem={(item) => (
          <List.Item actions={[<Button key="del" danger size="small" onClick={() => deleteFaq(item.id)}>Delete</Button>]}>
            <List.Item.Meta title={item.questionEn} description={item.answerEn} />
          </List.Item>
        )}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="New FAQ Item">
        <Form<FaqItemInput> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="questionAr" label="Question (Arabic)" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="questionEn" label="Question (English)" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="answerAr" label="Answer (Arabic)" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="answerEn" label="Answer (English)" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isSaving}>
            Add
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
