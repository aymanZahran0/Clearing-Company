import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Collapse } from "antd";
import { useListPublicFaqsQuery } from "../../../api/contentApi";

const MAX_FAQS_SHOWN = 4;

// US1 scenario 3 (FAQ preview section), reusing the existing public FAQ
// API (FR-006). Hides gracefully when no FAQs are configured (FR-007).
export function FaqPreviewSection() {
  const { t, i18n } = useTranslation();
  const { data: faqs, isLoading } = useListPublicFaqsQuery();
  const isAr = i18n.language === "ar";
  const preview = (faqs ?? []).slice(0, MAX_FAQS_SHOWN);

  if (!isLoading && preview.length === 0) return null;

  return (
    <section className="bg-gray-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("content:home.faq.title")}</h2>
          <Link to="/faq">
            <Button>{t("content:home.faq.viewAll")}</Button>
          </Link>
        </div>
        <Collapse
          items={preview.map((faq) => ({
            key: faq.id,
            label: isAr ? faq.questionAr : faq.questionEn || faq.questionAr,
            children: <p>{isAr ? faq.answerAr : faq.answerEn || faq.answerAr}</p>,
          }))}
        />
      </div>
    </section>
  );
}
