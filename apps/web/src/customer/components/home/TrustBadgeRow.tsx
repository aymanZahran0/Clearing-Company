import { useTranslation } from "react-i18next";
import { CheckCircleFilled } from "@ant-design/icons";
import { Reveal } from "./HomeMotion";

const BADGE_KEYS = ["punctuality", "quality", "pricing", "booking", "team", "materials"] as const;

// A row of short, scannable trust signals directly beneath the hero — the
// proposal's recurring value phrases (punctuality, guaranteed quality,
// clear pricing, fast booking, trained teams, safe materials), read at a
// glance before a first-time visitor commits to browsing further
// (PRODUCT.md: legitimacy before conversion).
export function TrustBadgeRow() {
  const { t } = useTranslation();

  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-10">
      <Reveal>
        <h2 className="sr-only">{t("content:home.trustBadges.title")}</h2>
        <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
          {BADGE_KEYS.map((key) => (
            <li
              key={key}
              className="home-feature-row flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-ink"
            >
              <CheckCircleFilled aria-hidden="true" className="text-accent" />
              {t(`content:home.trustBadges.${key}`)}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
