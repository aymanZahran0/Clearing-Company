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
  const isAr = i18n.language === "ar";

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold">{t("content:faq.title")}</h1>
      {isLoading && <Skeleton active />}
      {!isLoading && (
        <Collapse
          items={(data ?? []).map((item) => ({
            key: item.id,
            label: isAr ? item.questionAr : item.questionEn || item.questionAr,
            children: <p>{isAr ? item.answerAr : item.answerEn || item.answerAr}</p>,
          }))}
        />
      )}
    </div>
  );
}
