import { Button, Card, Input, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListSettingsQuery, useUpdateSettingMutation } from "../../../api/settingsApi";

// T175 (US-Polish)
export default function SystemSettings() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useListSettingsQuery();
  const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

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
      message.success(t("admin:settings.saved", { key }));
    } catch {
      message.error(t("admin:settings.saveError", { key }));
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:settings.title")}</h1>
      {isLoading && <Card loading />}
      {data?.map((setting) => (
        <Card key={setting.id} title={setting.key} className="mb-4">
          <p className="mb-2 text-sm text-gray-500">{setting.description}</p>
          <Input
            size="large"
            defaultValue={JSON.stringify(setting.value)}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [setting.key]: e.target.value }))}
            className="mb-2"
          />
          <Button type="primary" loading={isSaving} onClick={() => onSave(setting.key)}>
            {t("admin:common.save")}
          </Button>
        </Card>
      ))}
    </div>
  );
}
