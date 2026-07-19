import { Button, DatePicker, Form, Input, List, message } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useCreateClosedDateMutation, useListClosedDatesQuery } from "../../../api/availabilityApi";

interface ClosedDateFormValues {
  date: dayjs.Dayjs;
  reason?: string;
}

// T113 (US4): closed-date exceptions (holidays, planned downtime).
export default function ClosedDates() {
  const { t } = useTranslation();
  const { data, isLoading } = useListClosedDatesQuery();
  const [createClosedDate, { isLoading: isSaving }] = useCreateClosedDateMutation();
  const [form] = Form.useForm<ClosedDateFormValues>();

  async function onFinish(values: ClosedDateFormValues) {
    try {
      await createClosedDate({ date: values.date.toISOString(), reason: values.reason }).unwrap();
      form.resetFields();
      message.success(t("admin:schedule.closedDateAdded"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:schedule.closedDatesTitle")}</h1>
      <Form<ClosedDateFormValues> form={form} layout="inline" onFinish={onFinish} className="mb-6">
        <Form.Item name="date" rules={[{ required: true }]}>
          <DatePicker size="large" />
        </Form.Item>
        <Form.Item name="reason">
          <Input size="large" placeholder={t("admin:schedule.reasonOptional")} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={isSaving}>
            {t("admin:common.add")}
          </Button>
        </Form.Item>
      </Form>
      <List
        loading={isLoading}
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            {dayjs(item.date).format("YYYY-MM-DD")} {item.reason ? `— ${item.reason}` : ""}
          </List.Item>
        )}
      />
    </div>
  );
}
