import { Button, Form, Input, message } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../api/authApi";
import { setCredentials } from "../../features/auth/authSlice";

interface LoginFormValues {
  identifier: string;
  password: string;
}

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  async function onFinish(values: LoginFormValues) {
    try {
      const result = await login(values).unwrap();
      if (result.user.role !== "ADMIN") {
        message.error(t("common.error"));
        return;
      }
      dispatch(setCredentials(result));
      navigate("/admin");
    } catch {
      message.error(t("common.error"));
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.adminDashboard")}</h1>
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
    </div>
  );
}
