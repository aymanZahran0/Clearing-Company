import { Button, Form, Input, Rate, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateReviewMutation } from "../../api/reviewsApi";

interface ReviewFormValues {
  rating: number;
  comment?: string;
}

// T141 (US6): FR-050 rating + optional comment for a completed booking.
export default function ReviewForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createReview, { isLoading }] = useCreateReviewMutation();

  async function onFinish(values: ReviewFormValues) {
    if (!id) return;
    try {
      await createReview({ bookingId: id, rating: values.rating, comment: values.comment }).unwrap();
      message.success("Thank you for your feedback");
      navigate(`/bookings/${id}`);
    } catch {
      message.error("Could not submit your review");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Rate Your Service</h1>
      <Form<ReviewFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="rating" label="Rating" rules={[{ required: true }]}>
          <Rate />
        </Form.Item>
        <Form.Item name="comment" label="Comment (optional)">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          Submit Review
        </Button>
      </Form>
    </div>
  );
}
