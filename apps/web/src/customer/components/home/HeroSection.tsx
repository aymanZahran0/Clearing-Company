import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "antd";
import type { ContentBlock } from "../../../api/contentApi";
import homeSectionImage from "../../../assets/home-section.png";

interface HeroSectionProps { block?: ContentBlock; }

export function HeroSection({ block }: HeroSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const title = block ? (isAr ? block.titleAr : block.titleEn || block.titleAr) : t("content:home.hero.fallbackTitle");
  const body = block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.hero.fallbackBody");

  return (
    <section className="home-hero relative overflow-hidden px-4 sm:px-6">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="text-center lg:text-start">
          <span className="home-kicker">{t("content:home.hero.kicker")}</span>
          <h1 className="mobile-type-display mt-5 text-4xl font-black leading-tight text-ink sm:text-5xl" style={{ textWrap: "balance" }}>{title}</h1>
          <p className="mobile-type-leading mx-auto mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg lg:mx-0" style={{ textWrap: "pretty" }}>{body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link to="/services" className="home-button-link"><Button type="primary" size="large" className="home-primary-button">{t("content:home.hero.primaryCta")}</Button></Link>
            <Link to="/services" className="home-button-link"><Button size="large" className="home-outline-button">{t("content:home.hero.secondaryCta")}</Button></Link>
          </div>
        </div>
        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-hero-plate" />
          <div className="home-hero-mark"><img src={homeSectionImage} alt="" className="h-full w-full object-cover" /></div>
        </div>
      </div>
    </section>
  );
}
