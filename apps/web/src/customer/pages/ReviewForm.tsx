import { Button, Form, Input, Rate, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateReviewMutation } from "../../api/reviewsApi";

interface ReviewFormValues {
  rating: number;
  comment?: string;
}

// T141 (US6): FR-050 rating + optional comment for a completed booking.
export default function ReviewForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createReview, { isLoading }] = useCreateReviewMutation();

  async function onFinish(values: ReviewFormValues) {
    if (!id) return;
    try {
      await createReview({ bookingId: id, rating: values.rating, comment: values.comment }).unwrap();
      message.success(t("customer:reviewForm.thankYou"));
      navigate(`/bookings/${id}`);
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("customer:bookingDetail.rateThisService")}</h1>
      <Form<ReviewFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="rating" label={t("customer:reviewForm.rating")} rules={[{ required: true }]}>
          <Rate />
        </Form.Item>
        <Form.Item name="comment" label={t("customer:reviewForm.commentOptional")}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("customer:reviewForm.submitReview")}
        </Button>
      </Form>
    </div>
  );
}
