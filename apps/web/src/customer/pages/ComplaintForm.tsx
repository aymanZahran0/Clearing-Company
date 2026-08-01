import { Alert, Button, Form, Input, Select, Skeleton, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateComplaintMutation } from "../../api/qualityIssuesApi";
import { useGetBookingQuery } from "../../api/bookingsApi";

interface ComplaintFormValues {
  category: string;
  description: string;
}

const CATEGORIES = ["quality", "punctuality", "damage", "staff_conduct", "billing", "other"];

export default function ComplaintForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createComplaint, { isLoading }] = useCreateComplaintMutation();
  const { data: booking, isLoading: bookingLoading } = useGetBookingQuery(id ?? "", { skip: !id });
  const complaint = booking?.qualityIssues?.[0];

  if (bookingLoading) return <div className="p-6"><Skeleton active /></div>;
  if (complaint) {
    return <div className="p-6"><Alert type="info" showIcon message={t(`customer:complaintStatus.${complaint.status}`)} /></div>;
  }

  async function submit(values: ComplaintFormValues) {
    if (!id) return;
    try {
      await createComplaint({ bookingId: id, ...values }).unwrap();
      message.success(t("customer:complaintForm.submitted"));
      navigate(`/bookings/${id}`);
    } catch {
      // Global API middleware displays the error.
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("customer:bookingDetail.fileComplaint")}</h1>
      <Form<ComplaintFormValues> layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item name="category" label={t("customer:complaintForm.category")} rules={[{ required: true }]}>
          <Select
            size="large"
            options={CATEGORIES.map((category) => ({
              value: category,
              label: t(`customer:complaintForm.categories.${category}`),
            }))}
          />
        </Form.Item>
        <Form.Item name="description" label={t("customer:complaintForm.description")} rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("customer:complaintForm.submitComplaint")}
        </Button>
      </Form>
    </div>
  );
}
