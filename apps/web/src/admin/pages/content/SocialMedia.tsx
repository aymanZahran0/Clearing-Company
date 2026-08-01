import { useEffect, useState } from "react";
import { Button, Card, Input, Switch, message } from "antd";
import {
  FacebookFilled,
  InstagramOutlined,
  TikTokOutlined,
  WhatsAppOutlined,
  XOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useListAllSocialMediaLinksQuery,
  useUpsertSocialMediaLinkMutation,
  type SocialMediaLink,
  type SocialMediaPlatform,
} from "../../../api/socialMediaApi";
import { enumLabel } from "../../../lib/enumLabels";

// Fixed, known platform set (not an open-ended CRUD list) — the footer
// (customer/components/home/PublicFooter.tsx) only ever renders these five
// icons, in this order, so the admin editor mirrors that same order.
const PLATFORMS: { platform: SocialMediaPlatform; icon: JSX.Element }[] = [
  { platform: "FACEBOOK", icon: <FacebookFilled /> },
  { platform: "INSTAGRAM", icon: <InstagramOutlined /> },
  { platform: "TIKTOK", icon: <TikTokOutlined /> },
  { platform: "X", icon: <XOutlined /> },
  { platform: "WHATSAPP", icon: <WhatsAppOutlined /> },
];

export default function SocialMedia() {
  const { t } = useTranslation();
  const { data, isLoading } = useListAllSocialMediaLinksQuery();
  const [upsert, { isLoading: isSaving }] = useUpsertSocialMediaLinkMutation();
  const [drafts, setDrafts] = useState<Record<string, { url: string; active: boolean }>>({});

  // Server data (existing rows) seeds the draft state once it arrives;
  // platforms with no row yet start as an empty, inactive draft so every
  // platform is always editable even before its first save.
  useEffect(() => {
    if (!data) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const link of data) {
        if (!(link.platform in next)) {
          next[link.platform] = { url: link.url, active: link.active };
        }
      }
      return next;
    });
  }, [data]);

  function draftFor(platform: SocialMediaPlatform) {
    const existing = data?.find((link: SocialMediaLink) => link.platform === platform);
    return drafts[platform] ?? { url: existing?.url ?? "", active: existing?.active ?? false };
  }

  function setDraft(platform: SocialMediaPlatform, patch: Partial<{ url: string; active: boolean }>) {
    setDrafts((prev) => ({ ...prev, [platform]: { ...draftFor(platform), ...patch } }));
  }

  async function onSave(platform: SocialMediaPlatform) {
    const draft = draftFor(platform);
    if (!draft.url.trim()) {
      message.error(t("admin:socialMedia.urlRequired"));
      return;
    }
    try {
      await upsert({ platform, url: draft.url.trim(), active: draft.active }).unwrap();
      message.success(t("admin:socialMedia.saved", { platform: enumLabel("socialMediaPlatform", platform) }));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:socialMedia.title")}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("admin:socialMedia.description")}</p>
      {isLoading && <Card loading />}
      {!isLoading &&
        PLATFORMS.map(({ platform, icon }) => {
          const draft = draftFor(platform);
          return (
            <Card key={platform} className="mb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-40 items-center gap-2 text-base font-semibold">
                  <span className="text-xl">{icon}</span>
                  {enumLabel("socialMediaPlatform", platform)}
                </div>
                <Input
                  size="large"
                  dir="ltr"
                  className="flex-1 text-left"
                  placeholder={t("admin:socialMedia.urlPlaceholder")}
                  value={draft.url}
                  onChange={(e) => setDraft(platform, { url: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.active}
                    onChange={(checked) => setDraft(platform, { active: checked })}
                  />
                  <span className="text-sm text-gray-500">{t("admin:socialMedia.active")}</span>
                </div>
                <Button type="primary" size="large" loading={isSaving} onClick={() => onSave(platform)}>
                  {t("admin:common.save")}
                </Button>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
