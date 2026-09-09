import { Button, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../api/authApi";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [forgotPassword, { isLoading, isSuccess, reset }] = useForgotPasswordMutation();

  async function onFinish(values: { email: string }) {
    try {
      await forgotPassword({ email: values.email.trim().toLowerCase() }).unwrap();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-sm p-4 sm:p-6">
        <h1 className="mb-4 text-xl font-semibold">{t("customer:forgotPassword.checkEmail")}</h1>
        <p role="status" className="mb-4">
          {t("customer:forgotPassword.checkInstructions")}
        </p>
        <Button block size="large" onClick={reset}>
          {t("customer:forgotPassword.tryAgain")}
        </Button>
        <Link className="mt-4 inline-block py-2" to="/login">
          {t("customer:forgotPassword.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.forgotPassword")}</h1>
      <p className="mb-6">{t("customer:forgotPassword.description")}</p>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false} disabled={isLoading}>
        <Form.Item
          name="email"
          label={t("customer:forgotPassword.email")}
          normalize={(value: string) => value.trim()}
          rules={[
            { required: true, message: t("customer:forgotPassword.emailRequired") },
            { type: "email", max: 254, message: t("customer:forgotPassword.emailInvalid") },
          ]}
        >
          <Input size="large" type="email" autoComplete="email" dir="ltr" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("customer:forgotPassword.sendLink")}
        </Button>
      </Form>
      <Link className="mt-4 inline-block py-2" to="/login">
        {t("customer:forgotPassword.backToLogin")}
      </Link>
    </div>
  );
}
