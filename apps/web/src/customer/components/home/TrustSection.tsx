import { useTranslation } from "react-i18next";
import type { ContentBlock } from "../../../api/contentApi";
import { useGetPublicStatsQuery } from "../../../api/publicStatsApi";
import { CountUp, Reveal } from "./HomeMotion";

interface TrustSectionProps {
  block?: ContentBlock;
}

// US1 scenario 3 (trust/quality section) + scenario 7: statistics are
// never fabricated. Each stat tile renders only when its field is present
// in the /public/stats response (FR-007a) — a missing field means "not
// yet meaningful," not zero.
export function TrustSection({ block }: TrustSectionProps) {
  const { t, i18n } = useTranslation();
  const { data: stats } = useGetPublicStatsQuery();
  const isAr = i18n.language.startsWith("ar");
  const hasStats = stats?.completedBookingsCount !== undefined || stats?.averageRating !== undefined;

  return (
    <section className="home-section px-4 sm:px-6">
      <Reveal>
      <div className="home-trust-panel mx-auto max-w-4xl rounded-2xl p-7 text-center sm:p-10">
        <h2 className="home-section-title mb-4">{t("content:home.trust.title")}</h2>
        <p className="mx-auto max-w-2xl text-base text-muted">
          {block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.trust.fallbackBody")}
        </p>
        {hasStats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {stats?.completedBookingsCount !== undefined && (
              <div className="rounded-2xl bg-white px-6 py-5">
                <p className="text-2xl font-black text-primary sm:text-3xl">
                  <CountUp value={stats.completedBookingsCount}>{(count) => t("content:home.trust.completedBookings", { count })}</CountUp>
                </p>
              </div>
            )}
            {stats?.averageRating !== undefined && (
              <div className="rounded-2xl bg-white px-6 py-5">
                <p className="text-2xl font-black text-primary sm:text-3xl">
                  <CountUp value={stats.averageRating} decimals={1}>{(rating) => `${rating}/5`}</CountUp>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      </Reveal>
    </section>
  );
}
