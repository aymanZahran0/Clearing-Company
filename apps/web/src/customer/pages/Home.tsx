import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Skeleton } from "antd";
import { useListPublicContentBlocksQuery } from "../../api/contentApi";

// Public, prerender-eligible route (research.md R9). T055 (US5): renders
// Admin-managed SECTION content blocks instead of a static stub — an
// Admin edit shows up here with no redeploy.
export default function Home() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListPublicContentBlocksQuery();
  const isAr = i18n.language === "ar";
  const sections = (data ?? [])
    .filter((block) => block.type === "SECTION")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link to="/services">
          <Button type="primary" size="large">
            {t("nav.services")}
          </Button>
        </Link>
      </div>
      {isLoading && <Skeleton active />}
      {sections.map((block) => (
        <section key={block.id} className="mb-8">
          <h2 className="mb-2 text-2xl font-bold">{isAr ? block.titleAr : block.titleEn || block.titleAr}</h2>
          <p className="text-base">{isAr ? block.bodyAr : block.bodyEn || block.bodyAr}</p>
        </section>
      ))}
    </div>
  );
}
