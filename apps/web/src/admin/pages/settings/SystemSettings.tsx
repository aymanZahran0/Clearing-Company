import { Button, Card, Input, Popconfirm, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteSettingMutation, useListSettingsQuery, useUpdateSettingMutation } from "../../../api/settingsApi";

// T175 (US-Polish)
export default function SystemSettings() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useListSettingsQuery();
  const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation();
  const [deleteSetting] = useDeleteSettingMutation();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const settingLabel = (key: string) =>
    t(`admin:settings.fields.${key}.label`, { defaultValue: key });

  async function onDelete(key: string) {
    try {
      await deleteSetting(key).unwrap();
      message.success(t("admin:settings.deleted", { key: settingLabel(key) }));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  async function onSave(key: string) {
    const raw = drafts[key];
    if (raw === undefined) return;
    let value: unknown = raw;
    try {
      value = JSON.parse(raw);
    } catch {
      // plain string values (e.g. "ar-SA") are valid as-is
    }
    try {
      await updateSetting({ key, value }).unwrap();
      refetch();
      message.success(t("admin:settings.saved", { key: settingLabel(key) }));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:settings.title")}</h1>
      {isLoading && <Card loading />}
      {data?.map((setting) => (
        <Card key={setting.id} title={settingLabel(setting.key)} className="mb-4">
          <p className="mb-2 text-sm text-gray-500">
            {setting.description ||
              t(`admin:settings.fields.${setting.key}.description`, { defaultValue: "" })}
          </p>
          <Input
            size="large"
            defaultValue={JSON.stringify(setting.value)}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [setting.key]: e.target.value }))}
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button type="primary" loading={isSaving} onClick={() => onSave(setting.key)}>
              {t("admin:common.save")}
            </Button>
            <Popconfirm
              title={t("admin:common.delete")}
              description={t("admin:settings.deleteConfirm")}
              okText={t("admin:common.delete")}
              cancelText={t("common.cancel")}
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(setting.key)}
            >
              <Button danger>{t("admin:common.delete")}</Button>
            </Popconfirm>
          </div>
        </Card>
      ))}
    </div>
  );
}
