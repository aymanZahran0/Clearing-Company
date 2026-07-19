import { Button, Form, Input, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../api/authApi";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  async function onFinish(values: { newPassword: string }) {
    try {
      await resetPassword({ token, newPassword: values.newPassword }).unwrap();
      message.success(t("common.confirm") as string);
      navigate("/login");
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.resetPassword")}</h1>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="newPassword"
          label={t("auth.password")}
          rules={[{ required: true, min: 8 }]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("auth.submit")}
        </Button>
      </Form>
    </div>
  );
}
