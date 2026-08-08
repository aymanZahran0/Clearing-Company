import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "antd";
import type { ContentBlock } from "../../../api/contentApi";
import bucketArtwork from "../../../assets/cleaning.png";
import sprayArtwork from "../../../assets/cleaning2.png";

interface HeroSectionProps { block?: ContentBlock; }

// Centered, full-bleed gradient hero (Nuqaa Navy → Teal, DESIGN.md's two
// committed brand tones) — a deliberate landing moment reserved for this
// one band on the page, not a repeated device.
export function HeroSection({ block }: HeroSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const title = block ? (isAr ? block.titleAr : block.titleEn || block.titleAr) : t("content:home.hero.fallbackTitle");
  const body = block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.hero.fallbackBody");

  return (
    <section className="home-hero text-center" aria-labelledby="home-hero-title">
      <img src={bucketArtwork} alt="" className="home-hero-art home-hero-art--left" aria-hidden="true" />
      <img src={sprayArtwork} alt="" className="home-hero-art home-hero-art--right" aria-hidden="true" />
      <div className="home-hero-content mx-auto max-w-3xl px-4 sm:px-6">
        <span className="home-kicker home-kicker--on-dark">{t("content:home.hero.kicker")}</span>
        <h1 id="home-hero-title" className="home-hero-title mobile-type-display">{title}</h1>
        <p className="home-hero-body mobile-type-leading mx-auto" style={{ textWrap: "pretty" }}>{body}</p>
        <div className="home-hero-actions flex flex-wrap justify-center gap-3">
          <Link to="/services" className="home-button-link"><Button type="primary" size="large" className="home-primary-button home-hero-primary-button">{t("content:home.hero.primaryCta")}</Button></Link>
          <Link to="/services" className="home-button-link"><Button size="large" className="home-outline-button home-hero-outline-button">{t("content:home.hero.secondaryCta")}</Button></Link>
        </div>
      </div>
    </section>
  );
}
