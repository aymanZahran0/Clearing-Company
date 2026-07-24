import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Tag } from "antd";
import { useListServiceAreasQuery } from "../../../api/servicesApi";
import { Reveal } from "./HomeMotion";

// US1 scenario 3 (service areas section), using the existing active
// service-areas API (FR-006). Hides gracefully when no areas are
// configured yet (FR-007).
export function ServiceAreasSection() {
  const { t, i18n } = useTranslation();
  const { data: areas, isLoading } = useListServiceAreasQuery();
  const isAr = i18n.language === "ar";

  if (!isLoading && (areas ?? []).length === 0) return null;

  return (
    <section className="home-section bg-white px-4 sm:px-6">
      <Reveal>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="home-section-title">{t("content:home.serviceAreas.title")}</h2>
          <Link to="/service-areas">
            <Button className="home-outline-button">{t("content:home.serviceAreas.viewAll")}</Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(areas ?? []).map((area) => (
            <Tag key={area.id} bordered={false} className="home-area-pill rounded-full bg-accent-tint px-5 py-2.5 text-sm font-bold text-accent">
              {isAr ? area.nameAr : area.nameEn}
            </Tag>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}
