import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "antd";
import { WhatsAppOutlined } from "@ant-design/icons";
import type { ContentBlock } from "../../../api/contentApi";
import { buildWhatsAppUrl } from "../../../lib/whatsapp";

interface ContactCtaSectionProps {
  block?: ContentBlock;
}

export function ContactCtaSection({ block }: ContactCtaSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const whatsappMessage = isAr
    ? "مرحبًا، أريد حجز خدمة تنظيف."
    : "Hello, I would like to book a cleaning service.";
  const whatsappUrl = buildWhatsAppUrl(whatsappMessage);

  return (
    <section className="home-contact px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="home-section-title mb-3">{t("content:home.contact.title")}</h2>
        <p className="mb-6 text-base text-muted">
          {block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.contact.body")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="home-button-link"
          >
            <Button
              type="primary"
              size="large"
              icon={<WhatsAppOutlined />}
              className="home-whatsapp-button"
            >
              {t("content:home.contact.whatsappCta")}
            </Button>
          </a>
          <Link to="/track">
            <Button size="large" className="home-outline-button">{t("content:home.contact.trackBookingCta")}</Button>
          </Link>
          <Link to="/faq">
            <Button type="primary" size="large" className="home-primary-button">
              {t("nav.faq")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
