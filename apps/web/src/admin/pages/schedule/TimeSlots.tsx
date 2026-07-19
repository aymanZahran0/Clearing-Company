import { Button, DatePicker, Form, Input, InputNumber, Switch, Table, message } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  useCreateTimeSlotMutation,
  useListTimeSlotsQuery,
  useUpdateTimeSlotMutation,
  type AdminTimeSlot,
} from "../../../api/availabilityApi";

interface TimeSlotFormValues {
  date: dayjs.Dayjs;
  startTime: string;
  endTime: string;
  capacity: number;
}

// T113 (US4): time-slot capacity management, backing the schedule dialogs'
// slot picker and the "needs scheduling" calendar views.
export default function TimeSlots() {
  const { t } = useTranslation();
  const { data, isLoading } = useListTimeSlotsQuery();
  const [createTimeSlot, { isLoading: isCreating }] = useCreateTimeSlotMutation();
  const [updateTimeSlot] = useUpdateTimeSlotMutation();
  const [form] = Form.useForm<TimeSlotFormValues>();

  async function onFinish(values: TimeSlotFormValues) {
    try {
      await createTimeSlot({
        date: values.date.toISOString(),
        startTime: values.startTime,
        endTime: values.endTime,
        capacity: values.capacity,
      }).unwrap();
      form.resetFields();
      message.success(t("admin:schedule.timeSlotCreated"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:schedule.timeSlotsTitle")}</h1>
      <Form<TimeSlotFormValues> form={form} layout="inline" onFinish={onFinish} className="mb-6 flex-wrap gap-2">
        <Form.Item name="date" rules={[{ required: true }]}>
          <DatePicker size="large" placeholder={t("admin:schedule.date")} />
        </Form.Item>
        <Form.Item name="startTime" rules={[{ required: true, pattern: /^\d{2}:\d{2}$/ }]}>
          <Input size="large" placeholder="09:00" />
        </Form.Item>
        <Form.Item name="endTime" rules={[{ required: true, pattern: /^\d{2}:\d{2}$/ }]}>
          <Input size="large" placeholder="11:00" />
        </Form.Item>
        <Form.Item name="capacity" rules={[{ required: true }]}>
          <InputNumber size="large" min={1} placeholder={t("admin:schedule.capacity")} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={isCreating}>
            {t("admin:schedule.addSlot")}
          </Button>
        </Form.Item>
      </Form>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          {
            title: t("admin:schedule.date"),
            dataIndex: "date",
            render: (v: string) => dayjs(v).format("YYYY-MM-DD"),
          },
          { title: t("admin:schedule.start"), dataIndex: "startTime" },
          { title: t("admin:schedule.end"), dataIndex: "endTime" },
          {
            title: t("admin:schedule.capacity"),
            render: (_: unknown, row: AdminTimeSlot) => (
              <InputNumber
                size="large"
                min={row.bookedCount}
                defaultValue={row.capacity}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value && value !== row.capacity) {
                    updateTimeSlot({ id: row.id, capacity: value });
                  }
                }}
              />
            ),
          },
          { title: t("admin:schedule.booked"), dataIndex: "bookedCount" },
          {
            title: t("admin:content.active"),
            render: (_: unknown, row: AdminTimeSlot) => (
              <Switch
                checked={row.active}
                onChange={(active) => updateTimeSlot({ id: row.id, active })}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
