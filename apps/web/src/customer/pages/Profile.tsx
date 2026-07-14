import { Button, Checkbox, Form, Input, Skeleton, message } from "antd";
import { useTranslation } from "react-i18next";
import { useGetOwnProfileQuery, useUpdateOwnProfileMutation } from "../../api/customersApi";

interface ProfileFormValues {
  fullName: string;
  email?: string;
  marketingConsent: boolean;
}

export default function Profile() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGetOwnProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateOwnProfileMutation();

  async function onFinish(values: ProfileFormValues) {
    try {
      await updateProfile(values).unwrap();
      message.success(t("common.save") as string);
    } catch {
      message.error(t("common.error") as string);
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
    </div>
  );
}
