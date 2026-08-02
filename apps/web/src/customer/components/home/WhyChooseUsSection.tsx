import { useTranslation } from "react-i18next";
import { Button, Tag } from "antd";
import { Link } from "react-router-dom";
import type { ContentBlock } from "../../../api/contentApi";
import { useGetPublicStatsQuery } from "../../../api/publicStatsApi";
import { useListServiceAreasQuery } from "../../../api/servicesApi";
import { CountUp, Reveal } from "./HomeMotion";

interface WhyChooseUsSectionProps {
  block?: ContentBlock;
  trustBlock?: ContentBlock;
}

const FALLBACK_FEATURE_KEYS = [1, 2, 3] as const;

// The benefits, live service areas, and verified public statistics share one
// composition so the related trust signals are understood at a glance.
export function WhyChooseUsSection({ block, trustBlock }: WhyChooseUsSectionProps) {
  const { t, i18n } = useTranslation();
  const { data: areas, isLoading: areasLoading } = useListServiceAreasQuery();
  const { data: stats } = useGetPublicStatsQuery();
  const isAr = i18n.language.startsWith("ar");
  const hasStats =
    stats?.completedBookingsCount !== undefined ||
    stats?.averageRating !== undefined;
  const intro = block
    ? isAr
      ? block.bodyAr
      : block.bodyEn || block.bodyAr
    : trustBlock
      ? isAr
        ? trustBlock.bodyAr
        : trustBlock.bodyEn || trustBlock.bodyAr
      : t("content:home.trust.fallbackBody");

  return (
    <section className="home-section px-4 sm:px-6" aria-labelledby="why-us-title">
      <Reveal>
        <div className="mx-auto grid max-w-7xl items-start gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="mb-3 text-sm font-extrabold text-accent">
              {t("content:home.whyUs.kicker")}
            </p>
            <h2 id="why-us-title" className="home-section-title">
              {t("content:home.whyUs.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted">{intro}</p>

            <div className="mt-8 space-y-6">
              {FALLBACK_FEATURE_KEYS.map((n) => (
                <div key={n} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-2 block h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
                  />
                  <div>
                    <h3 className="m-0 text-base font-extrabold text-ink">
                      {t(`content:home.whyUs.fallbackFeature${n}Title`)}
                    </h3>
                    <p className="mb-0 mt-1 text-sm leading-7 text-muted">
                      {t(`content:home.whyUs.fallbackFeature${n}Body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="home-section-title">{t("content:home.serviceAreas.title")}</h2>
              <Link to="/service-areas">
                <Button className="home-outline-button">
                  {t("content:home.serviceAreas.viewAll")}
                </Button>
              </Link>
            </div>

            <div className="mt-7 flex min-h-12 flex-wrap items-center justify-start gap-3">
              {(areas ?? []).map((area) => (
                <Tag
                  key={area.id}
                  bordered={false}
                  className="home-area-pill rounded-full bg-accent-tint px-6 py-3 text-sm font-extrabold text-primary"
                >
                  {isAr ? area.nameAr : area.nameEn}
                </Tag>
              ))}
              {!areasLoading && (areas ?? []).length === 0 && (
                <p className="m-0 text-sm text-muted">{t("content:home.serviceAreas.empty")}</p>
              )}
            </div>

            <div className="home-trust-panel mt-8 rounded-2xl px-7 py-7 sm:px-10">
              <h3 className="m-0 text-base font-extrabold text-ink">
                {t("content:home.trust.title")}
              </h3>
              {hasStats ? (
                <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-7 text-start">
                  {stats?.completedBookingsCount !== undefined && (
                    <div>
                      <p className="m-0 text-3xl font-black text-primary">
                        +
                        <CountUp value={stats.completedBookingsCount}>
                          {(count) => count}
                        </CountUp>
                      </p>
                      <p className="mb-0 mt-2 text-sm text-muted">
                        {t("content:home.trust.completedBookingsLabel")}
                      </p>
                    </div>
                  )}
                  {stats?.averageRating !== undefined && (
                    <div>
                      <p className="m-0 text-3xl font-black text-primary">
                        <CountUp value={stats.averageRating} decimals={1}>
                          {(rating) => `${rating}/5`}
                        </CountUp>
                      </p>
                      <p className="mb-0 mt-2 text-sm text-muted">
                        {t("content:home.trust.averageRatingLabel")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mb-0 mt-4 text-sm leading-7 text-muted">
                  {trustBlock
                    ? isAr
                      ? trustBlock.bodyAr
                      : trustBlock.bodyEn || trustBlock.bodyAr
                    : t("content:home.trust.fallbackBody")}
                </p>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
