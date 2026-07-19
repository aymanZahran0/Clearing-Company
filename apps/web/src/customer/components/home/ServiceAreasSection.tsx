import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Tag } from "antd";
import { useListServiceAreasQuery } from "../../../api/servicesApi";

// US1 scenario 3 (service areas section), using the existing active
// service-areas API (FR-006). Hides gracefully when no areas are
// configured yet (FR-007).
export function ServiceAreasSection() {
  const { t, i18n } = useTranslation();
  const { data: areas, isLoading } = useListServiceAreasQuery();
  const isAr = i18n.language === "ar";

  if (!isLoading && (areas ?? []).length === 0) return null;

  return (
    <section className="bg-gray-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("content:home.serviceAreas.title")}</h2>
          <Link to="/service-areas">
            <Button>{t("content:home.serviceAreas.viewAll")}</Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(areas ?? []).map((area) => (
            <Tag key={area.id} className="px-3 py-1.5 text-sm">
              {isAr ? area.nameAr : area.nameEn}
            </Tag>
          ))}
        </div>
      </div>
    </section>
  );
}
