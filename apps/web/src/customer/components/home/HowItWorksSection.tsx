import { useTranslation } from "react-i18next";
import { Reveal } from "./HomeMotion";

const STEP_KEYS = [1, 2, 3, 4] as const;

// US1 scenario 3 ("how booking works" section). Static, translated steps —
// this workflow itself doesn't change per environment, so it isn't backed
// by a content block (only the marketing copy sections are).
export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="home-section bg-white px-4 sm:px-6">
      <Reveal>
      <div className="mx-auto max-w-6xl">
        <h2 className="home-section-title mb-10 text-center">{t("content:home.howItWorks.title")}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_KEYS.map((n) => (
            <div key={n} className="home-step-card flex flex-col items-center gap-3 rounded-2xl bg-paper p-6 text-center">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-black text-white"
              >
                {n}
              </div>
              <h3 className="text-base font-semibold text-ink">{t(`content:home.howItWorks.step${n}Title`)}</h3>
              <p className="text-sm text-muted">{t(`content:home.howItWorks.step${n}Body`)}</p>
            </div>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}
