import { Button, Checkbox, Form, Input, Skeleton, message } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetOwnProfileQuery, useUpdateOwnProfileMutation } from "../../api/customersApi";
import { useChangePasswordMutation } from "../../api/authApi";
import { baseApi } from "../../api/baseApi";
import { clearAuth } from "../../features/auth/authSlice";

interface ProfileFormValues {
  fullName: string;
  email?: string;
  marketingConsent: boolean;
}

interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
}

export default function Profile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useGetOwnProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateOwnProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [passwordForm] = Form.useForm<ChangePasswordFormValues>();

  async function onFinish(values: ProfileFormValues) {
    try {
      await updateProfile(values).unwrap();
      message.success(t("common.save") as string);
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function onChangePassword(values: ChangePasswordFormValues) {
    try {
      await changePassword(values).unwrap();
      // Changing the password revokes every session server-side (see
      // authApi.changePassword) — clear local auth state and send the user
      // back to log in with the new password.
      passwordForm.resetFields();
      message.success(t("auth.changePasswordSuccess") as string);
      dispatch(clearAuth());
      dispatch(baseApi.util.resetApiState());
      navigate("/login");
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.profile")}</h1>
      <Form<ProfileFormValues>
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          fullName: profile.fullName,
          email: profile.email ?? undefined,
          marketingConsent: profile.marketingConsent,
        }}
      >
        <Form.Item name="fullName" label={t("auth.fullName")}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="email" label={t("auth.email")}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="marketingConsent" valuePropName="checked">
          <Checkbox>{t("auth.marketingConsent")}</Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isSaving}>
          {t("common.save")}
        </Button>
      </Form>

      <h2 className="mb-4 mt-8 border-t border-hairline pt-6 text-lg font-semibold">
        {t("auth.changePassword")}
      </h2>
      <Form<ChangePasswordFormValues> form={passwordForm} layout="vertical" onFinish={onChangePassword} requiredMark={false}>
        <Form.Item name="oldPassword" label={t("auth.currentPassword")} rules={[{ required: true }]}>
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="newPassword" label={t("auth.newPassword")} rules={[{ required: true, min: 8 }]}>
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={isChangingPassword}>
          {t("auth.changePassword")}
        </Button>
      </Form>
    </div>
  );
}
