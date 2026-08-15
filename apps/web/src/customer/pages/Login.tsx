import { Button, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../api/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import { baseApi } from "../../api/baseApi";

interface LoginFormValues {
  identifier: string;
  password: string;
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  async function onFinish(values: LoginFormValues) {
    try {
      const result = await login(values).unwrap();
      dispatch(baseApi.util.resetApiState());
      dispatch(setCredentials(result));
      if (result.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }
      // Preserve the full path the guard redirected from — pathname alone
      // drops query params like `/booking/new?serviceId=...`, silently
      // losing the service the customer picked before being sent to log in.
      const from = (location.state as { from?: { pathname: string; search: string; hash: string } })?.from;
      const redirectTo = from ? `${from.pathname}${from.search}${from.hash}` : "/bookings";
      navigate(redirectTo, { replace: true });
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.login")}</h1>
      <Form<LoginFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="identifier" label={t("auth.identifier")} rules={[{ required: true }]}>
          <Input size="large" autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label={t("auth.password")} rules={[{ required: true }]}>
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("auth.submit")}
        </Button>
      </Form>
      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
        <Link to="/register">{t("auth.register")}</Link>
      </div>
    </div>
  );
}
