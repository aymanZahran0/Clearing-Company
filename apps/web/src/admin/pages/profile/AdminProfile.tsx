import { Button, Card, Form, Input, Skeleton, message } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useUpdateAdminAccountMutation } from "../../../api/authApi";
import { baseApi } from "../../../api/baseApi";
import type { RootState } from "../../../app/store";
import { clearAuth, updateUser } from "../../../features/auth/authSlice";

interface AccountFormValues {
  email: string;
  currentPassword: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function AdminProfile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [form] = Form.useForm<AccountFormValues>();
  const [updateAdminAccount, { isLoading }] = useUpdateAdminAccountMutation();

  async function onSave(values: AccountFormValues) {
    const emailChanged = values.email.trim().toLowerCase() !== user?.email?.toLowerCase();
    const newPassword = values.newPassword || undefined;
    if (!emailChanged && !newPassword) {
      message.info(t("admin:settings.account.noChanges"));
      return;
    }

    try {
      const result = await updateAdminAccount({
        ...(emailChanged ? { email: values.email.trim() } : {}),
        currentPassword: values.currentPassword,
        ...(newPassword ? { newPassword } : {}),
      }).unwrap();
      form.setFieldsValue({ currentPassword: "", newPassword: "", confirmPassword: "" });

      if (result.passwordChanged) {
        message.success(t("admin:settings.account.passwordChanged"));
        dispatch(clearAuth());
        dispatch(baseApi.util.resetApiState());
        navigate("/login");
        return;
      }

      dispatch(updateUser(result.user));
      message.success(t("admin:settings.account.saved"));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.profile")}</h1>
      <Card className="max-w-2xl" title={t("admin:settings.account.title")}>
        <p className="mb-4 text-sm text-gray-600">{t("admin:settings.account.description")}</p>
        {!user ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <Form<AccountFormValues>
            form={form}
            layout="vertical"
            initialValues={{ email: user.email ?? "" }}
            onFinish={onSave}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={t("admin:settings.account.email")}
              extra={t("admin:settings.account.emailHelp")}
              rules={[
                { required: true },
                { type: "email", message: t("admin:settings.account.emailInvalid") },
              ]}
            >
              <Input size="large" type="email" autoComplete="email" />
            </Form.Item>
            <Form.Item name="currentPassword" label={t("admin:settings.account.currentPassword")} rules={[{ required: true }]}>
              <Input.Password size="large" autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label={t("admin:settings.account.newPassword")}
              extra={t("admin:settings.account.passwordHelp")}
              rules={[{ min: 8 }]}
            >
              <Input.Password size="large" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t("admin:settings.account.confirmPassword")}
              dependencies={["newPassword"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!getFieldValue("newPassword") || value === getFieldValue("newPassword")) return Promise.resolve();
                    return Promise.reject(new Error(t("admin:settings.account.passwordMismatch")));
                  },
                }),
              ]}
            >
              <Input.Password size="large" autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={isLoading}>
              {t("admin:settings.account.save")}
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
