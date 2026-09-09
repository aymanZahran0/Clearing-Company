import { Button, Form, Input, message } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useResetPasswordMutation } from "../../api/authApi";
import { baseApi } from "../../api/baseApi";
import { clearAuth } from "../../features/auth/authSlice";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const invalidLink =
    !/^[a-f0-9]{64}$/.test(token) || (error && "status" in error && error.status === 400);

  async function onFinish(values: { newPassword: string }) {
    try {
      await resetPassword({ token, newPassword: values.newPassword }).unwrap();
      dispatch(clearAuth());
      dispatch(baseApi.util.resetApiState());
      message.success(t("customer:resetPassword.success"));
      navigate("/login", { replace: true });
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.resetPassword")}</h1>
      {invalidLink ? (
        <>
          <p role="alert" className="mb-4">
            {t("customer:resetPassword.invalidLink")}
          </p>
          <Link className="inline-block py-2" to="/forgot-password">
            {t("customer:resetPassword.requestLink")}
          </Link>
        </>
      ) : (
        <Form layout="vertical" onFinish={onFinish} requiredMark={false} disabled={isLoading}>
          <Form.Item
            name="newPassword"
            label={t("auth.password")}
            rules={[
              { required: true, message: t("customer:resetPassword.passwordRequired") },
              { min: 8, max: 200, message: t("customer:resetPassword.passwordLength") },
            ]}
            extra={t("customer:resetPassword.passwordLength")}
          >
            <Input.Password size="large" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t("customer:resetPassword.confirmPassword")}
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: t("customer:resetPassword.confirmRequired") },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  return !value || getFieldValue("newPassword") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t("customer:resetPassword.passwordMismatch")));
                },
              }),
            ]}
          >
            <Input.Password size="large" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("auth.resetPassword")}
          </Button>
        </Form>
      )}
    </div>
  );
}
