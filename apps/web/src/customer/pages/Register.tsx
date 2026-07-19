import { Button, Checkbox, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../../api/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import { baseApi } from "../../api/baseApi";

interface RegisterFormValues {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  marketingConsent?: boolean;
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  async function onFinish(values: RegisterFormValues) {
    try {
      const result = await register(values).unwrap();
      dispatch(baseApi.util.resetApiState());
      dispatch(setCredentials(result));
      navigate("/bookings");
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.register")}</h1>
      <Form<RegisterFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="fullName"
          label={t("auth.fullName")}
          rules={[{ required: true, min: 2, max: 200 }]}
        >
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="phone"
          label={t("auth.phone")}
          rules={[{ required: true }]}
        >
          <Input size="large" inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX" />
        </Form.Item>
        <Form.Item name="email" label={t("auth.email")} rules={[{ type: "email" }]}>
          <Input size="large" inputMode="email" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t("auth.password")}
          rules={[{ required: true, min: 8 }]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="marketingConsent" valuePropName="checked">
          <Checkbox>{t("auth.marketingConsent")}</Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
          {t("auth.submit")}
        </Button>
      </Form>
    </div>
  );
}
