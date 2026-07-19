import { useTranslation } from "react-i18next";
import type { ContentBlock } from "../../../api/contentApi";
import { useGetPublicStatsQuery } from "../../../api/publicStatsApi";

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
  const isAr = i18n.language === "ar";
  const hasStats = stats?.completedBookingsCount !== undefined || stats?.averageRating !== undefined;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">{t("content:home.trust.title")}</h2>
        <p className="mx-auto max-w-2xl text-base text-gray-600">
          {block ? (isAr ? block.bodyAr : block.bodyEn || block.bodyAr) : t("content:home.trust.fallbackBody")}
        </p>
        {hasStats && (
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {stats?.completedBookingsCount !== undefined && (
              <div className="rounded-lg bg-blue-50 px-6 py-4">
                <p className="text-xl font-bold text-blue-700">
                  {t("content:home.trust.completedBookings", { count: stats.completedBookingsCount })}
                </p>
              </div>
            )}
            {stats?.averageRating !== undefined && (
              <div className="rounded-lg bg-blue-50 px-6 py-4">
                <p className="text-xl font-bold text-blue-700">
                  {t("content:home.trust.averageRating", { rating: stats.averageRating })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
