import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "antd";
import type { ContentBlock } from "../../../api/contentApi";

interface HeroSectionProps {
  block?: ContentBlock;
}

// US1 scenario 1: full-width hero with title/description/primary+secondary
// CTA and a visual area. Uses the `home-hero` WebsiteContentBlock when an
// Admin has configured one (FR-006), falling back to polished static
// Arabic/English copy so the section is never broken/empty (FR-007).
export function HeroSection({ block }: HeroSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const title = block ? (isAr ? block.titleAr : block.titleEn || block.titleAr) : t("content:home.hero.fallbackTitle");
  const body = block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.hero.fallbackBody");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        <div
          aria-hidden="true"
          className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-5xl sm:h-36 sm:w-36"
        >
          🧽
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">{body}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/booking/new">
            <Button type="primary" size="large">
              {t("content:home.hero.primaryCta")}
            </Button>
          </Link>
          <Link to="/services">
            <Button size="large">{t("content:home.hero.secondaryCta")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
