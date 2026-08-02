import { Collapse, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useListPublicFaqsQuery } from "../../api/contentApi";

// T053 (US5): public, prerender-eligible FAQ page. listPublicFaqs already
// filters to active-only server-side (FR-028), so every entry here is
// meant to be shown. An English gap falls back to Arabic rather than
// rendering blank — Arabic is the one field the write-side schema always
// requires non-empty (Edge Cases).
export default function Faq() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListPublicFaqsQuery();
  const isAr = i18n.language.startsWith("ar");
  const faqs = data ?? [];

  return (
    <main className="home-section min-h-[60vh] bg-white px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="home-section-title">{t("content:faq.title")}</h1>
        </div>

        {isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : null}

        {!isLoading && faqs.length > 0 ? (
          <Collapse
            className="home-faq"
            defaultActiveKey={faqs[0]?.id ? [faqs[0].id] : []}
            items={faqs.map((item) => ({
              key: item.id,
              label: isAr ? item.questionAr : item.questionEn || item.questionAr,
              children: (
                <p className="m-0 whitespace-pre-line">
                  {isAr ? item.answerAr : item.answerEn || item.answerAr}
                </p>
              ),
            }))}
          />
        ) : null}

        {!isLoading && faqs.length === 0 ? (
          <p className="m-0 text-muted">{t("content:home.faq.empty")}</p>
        ) : null}
      </div>
    </main>
  );
}
