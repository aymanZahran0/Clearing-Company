import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Collapse } from "antd";
import { useListPublicFaqsQuery } from "../../../api/contentApi";
import { Reveal } from "./HomeMotion";

const MAX_FAQS_SHOWN = 4;

// US1 scenario 3 (FAQ preview section), reusing the existing public FAQ
// API (FR-006). Hides gracefully when no FAQs are configured (FR-007).
export function FaqPreviewSection() {
  const { t, i18n } = useTranslation();
  const { data: faqs, isLoading } = useListPublicFaqsQuery();
  const isAr = i18n.language.startsWith("ar");
  const preview = (faqs ?? []).slice(0, MAX_FAQS_SHOWN);

  if (!isLoading && preview.length === 0) return null;

  return (
    <section className="home-section bg-white px-4 sm:px-6">
      <Reveal>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="home-section-title">{t("content:home.faq.title")}</h2>
          <Link to="/faq">
            <Button className="home-outline-button">{t("content:home.faq.viewAll")}</Button>
          </Link>
        </div>
        <Collapse
          className="home-faq"
          defaultActiveKey={preview[0]?.id ? [preview[0].id] : []}
          items={preview.map((faq) => ({
            key: faq.id,
            label: isAr ? faq.questionAr : faq.questionEn || faq.questionAr,
            children: <p>{isAr ? faq.answerAr : faq.answerEn || faq.answerAr}</p>,
          }))}
        />
      </div>
      </Reveal>
    </section>
  );
}
