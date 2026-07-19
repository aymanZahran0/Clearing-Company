import { useState } from "react";
import { Button, Form, Input, List, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import {
  useCreateFaqItemMutation,
  useDeleteFaqItemMutation,
  useListAllFaqsQuery,
  type FaqItemInput,
} from "../../../api/contentApi";

// T173 (US-Polish)
export default function FAQs() {
  const { t } = useTranslation();
  const { data, isLoading } = useListAllFaqsQuery();
  const [createFaq, { isLoading: isSaving }] = useCreateFaqItemMutation();
  const [deleteFaq] = useDeleteFaqItemMutation();
  const [open, setOpen] = useState(false);

  async function onFinish(values: FaqItemInput) {
    try {
      await createFaq(values).unwrap();
      setOpen(false);
      message.success(t("admin:content.faqAdded"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin:content.faqsTitle")}</h1>
        <Button type="primary" size="large" onClick={() => setOpen(true)}>
          {t("admin:content.newFaq")}
        </Button>
      </div>
      <List
        loading={isLoading}
        dataSource={data}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button key="del" danger size="small" onClick={() => deleteFaq(item.id)}>
                {t("admin:common.delete")}
              </Button>,
            ]}
          >
            <List.Item.Meta title={item.questionEn} description={item.answerEn} />
          </List.Item>
        )}
      />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:content.newFaqItem")}>
        <Form<FaqItemInput> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="questionAr" label={t("admin:content.questionAr")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="questionEn" label={t("admin:content.questionEn")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="answerAr" label={t("admin:content.answerAr")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="answerEn" label={t("admin:content.answerEn")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isSaving}>
            {t("admin:common.add")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
