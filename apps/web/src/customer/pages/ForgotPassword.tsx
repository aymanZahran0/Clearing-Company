import { Button, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { useForgotPasswordMutation } from "../../api/authApi";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();

  async function onFinish(values: { identifier: string }) {
    try {
      await forgotPassword(values).unwrap();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-sm p-4 sm:p-6">
        <p>{t("customer:forgotPassword.checkInstructions")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.forgotPassword")}</h1>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="identifier" label={t("auth.identifier")} rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("auth.submit")}
        </Button>
      </Form>
    </div>
  );
}
