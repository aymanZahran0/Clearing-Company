import { Button, Form, Input, Select, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateComplaintMutation } from "../../api/qualityIssuesApi";

interface ComplaintFormValues {
  category: string;
  description: string;
}

const CATEGORIES = [
  "quality",
  "punctuality",
  "damage",
  "staff_conduct",
  "billing",
  "other",
];

// T141 (US6): FR-052 standalone complaint, independent of the star rating.
export default function ComplaintForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createComplaint, { isLoading }] = useCreateComplaintMutation();

  async function onFinish(values: ComplaintFormValues) {
    if (!id) return;
    try {
      await createComplaint({ bookingId: id, ...values }).unwrap();
      message.success("Your complaint has been submitted");
      navigate(`/bookings/${id}`);
    } catch {
      message.error("Could not submit your complaint");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">File a Complaint</h1>
      <Form<ComplaintFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select size="large" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          Submit Complaint
        </Button>
      </Form>
    </div>
  );
}
