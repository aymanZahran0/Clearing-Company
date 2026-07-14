import { Button, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useGetServiceBySlugQuery } from "../../api/servicesApi";
import { formatCurrency } from "../../lib/formatters";

// Public, prerender-eligible route (research.md R9).
export default function ServiceDetail() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading } = useGetServiceBySlugQuery(slug ?? "", { skip: !slug });
  const isAr = i18n.language === "ar";

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  if (!service) {
    return <div className="p-4 sm:p-6">{t("common.error")}</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{isAr ? service.nameAr : service.nameEn}</h1>
      <p className="mt-2 text-gray-600">{isAr ? service.descriptionAr : service.descriptionEn}</p>
      <div className="mt-4">
        {service.basePrice != null ? (
          <span className="text-xl font-semibold">
            {formatCurrency(service.basePrice, i18n.language)}
          </span>
        ) : (
          <Tag color="gold">{t("common.confirm")}</Tag>
        )}
      </div>
      {service.addOns.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">{t("nav.services")}</h2>
          <ul className="mt-2 space-y-2">
            {service.addOns.map((addOn) => (
              <li key={addOn.id} className="flex justify-between">
                <span>{isAr ? addOn.nameAr : addOn.nameEn}</span>
                <span>{formatCurrency(addOn.unitPrice, i18n.language)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link to={`/booking/new?serviceId=${service.id}`}>
        <Button type="primary" size="large" className="mt-6" block>
          {t("common.confirm")}
        </Button>
      </Link>
    </div>
  );
}
