import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import { WhatsAppOutlined } from "@ant-design/icons";
import { buildWhatsAppUrl } from "../../lib/whatsapp";

// Fixed corner shortcut so a WhatsApp chat is reachable from anywhere on
// the customer site, not just after scrolling down to the homepage's
// contact section.
export function WhatsAppFloatingButton() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const message = isAr
    ? "مرحبًا، أريد حجز خدمة تنظيف."
    : "Hello, I would like to book a cleaning service.";

  return (
    <Tooltip title={t("content:home.contact.whatsappTooltip")} placement="top">
      <a
        href={buildWhatsAppUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("content:home.contact.whatsappTooltip") as string}
        className="fixed bottom-5 start-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b6b52] text-2xl text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#25D366] hover:shadow-xl"
      >
        <WhatsAppOutlined />
      </a>
    </Tooltip>
  );
}
