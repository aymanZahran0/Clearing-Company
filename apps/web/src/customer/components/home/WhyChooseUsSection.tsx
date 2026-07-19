import { useTranslation } from "react-i18next";
import type { ContentBlock } from "../../../api/contentApi";

interface WhyChooseUsSectionProps {
  block?: ContentBlock;
}

const FALLBACK_FEATURE_KEYS = [1, 2, 3] as const;

// US1 scenario 3 ("why choose us" section). Uses the `home-why-us`
// WebsiteContentBlock as free-form text when configured (FR-006); falls
// back to three structured feature items otherwise (FR-007).
export function WhyChooseUsSection({ block }: WhyChooseUsSectionProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">{t("content:home.whyUs.title")}</h2>
        {block ? (
          <p className="mx-auto max-w-3xl text-center text-base text-gray-700">
            {isAr ? block.bodyAr : block.bodyEn || block.bodyAr}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FALLBACK_FEATURE_KEYS.map((n) => (
              <div key={n} className="rounded-lg border border-gray-100 p-4 text-center shadow-sm">
                <h3 className="text-base font-semibold">{t(`content:home.whyUs.fallbackFeature${n}Title`)}</h3>
                <p className="mt-2 text-sm text-gray-600">{t(`content:home.whyUs.fallbackFeature${n}Body`)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
