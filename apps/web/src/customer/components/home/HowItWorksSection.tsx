import { useTranslation } from "react-i18next";

const STEP_KEYS = [1, 2, 3, 4] as const;

// US1 scenario 3 ("how booking works" section). Static, translated steps —
// this workflow itself doesn't change per environment, so it isn't backed
// by a content block (only the marketing copy sections are).
export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-gray-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">{t("content:home.howItWorks.title")}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_KEYS.map((n) => (
            <div key={n} className="flex flex-col items-center gap-2 rounded-lg bg-white p-4 text-center shadow-sm">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
              >
                {n}
              </div>
              <h3 className="text-base font-semibold">{t(`content:home.howItWorks.step${n}Title`)}</h3>
              <p className="text-sm text-gray-600">{t(`content:home.howItWorks.step${n}Body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
