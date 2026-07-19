import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "antd";
import type { ContentBlock } from "../../../api/contentApi";

interface ContactCtaSectionProps {
  block?: ContentBlock;
}

// US1 scenario 3 (contact CTA section). WhatsApp remains the existing
// manual, Admin-initiated click-to-chat channel (002 clarification) — no
// business phone/WhatsApp number is configured anywhere in the system to
// link to here, so this section surfaces the Admin-configured
// `home-contact` content block (if any) plus the existing booking-lookup
// route, rather than fabricating contact details.
export function ContactCtaSection({ block }: ContactCtaSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-3 text-2xl font-bold sm:text-3xl">{t("content:home.contact.title")}</h2>
        <p className="mb-6 text-base text-gray-600">
          {block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.contact.body")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/track">
            <Button size="large">{t("content:home.contact.trackBookingCta")}</Button>
          </Link>
          <Link to="/faq">
            <Button type="primary" size="large">
              {t("nav.faq")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
