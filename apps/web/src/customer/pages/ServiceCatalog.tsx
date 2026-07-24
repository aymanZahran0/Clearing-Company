import { Empty, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useListServicesQuery, type Service } from "../../api/servicesApi";
import { formatCurrency } from "../../lib/formatters";
import defaultServiceImage from "../../assets/logo/logo-without-name.png";

function getPrice(service: Service, language: string, customQuoteLabel: string) {
  const amount = service.basePrice ?? service.minimumPrice;
  if (amount == null) return customQuoteLabel;
  return formatCurrency(amount, language);
}

// Public, prerender-eligible route (research.md R9).
export default function ServiceCatalog() {
  const { t, i18n } = useTranslation();
  const { data: services, isLoading } = useListServicesQuery();

  return (
    <main className="service-catalog px-4 sm:px-6" aria-labelledby="service-catalog-title">
      <div className="mx-auto max-w-7xl">
        <header className="service-catalog-header">
          <p className="home-services-label">{t("content:home.services.title")}</p>
          <h1 id="service-catalog-title" className="home-section-title">
            {t("content:home.services.headline")}
          </h1>
        </header>

        {isLoading && <Skeleton active paragraph={{ rows: 10 }} />}
        {!isLoading && services?.length === 0 && <Empty description={t("content:home.services.empty")} />}

        {!isLoading && services && services.length > 0 && (
          <div className="home-services-grid service-catalog-grid">
            {services.map((service) => {
              const name = service.nameAr;
              const description = service.descriptionAr;
              const price = getPrice(service, i18n.language, t("content:home.services.customQuote"));
              const hasListedPrice = service.basePrice != null || service.minimumPrice != null;
              const serviceImage = service.images[0];

              return (
                <Link
                  to={`/services/${service.slug}`}
                  className="home-service-card"
                  key={service.id}
                  aria-label={`${name} — ${t("content:home.services.details")}`}
                >
                  <div className="home-service-media">
                    <img
                      src={serviceImage?.url || defaultServiceImage}
                      alt={serviceImage?.altTextAr || name}
                      className={serviceImage ? undefined : "is-fallback"}
                    />
                  </div>
                  <h2>{name}</h2>
                  {description && <p>{description}</p>}
                  <div className="home-service-card-footer">
                    <strong>{hasListedPrice ? t("content:home.services.startsAt", { price }) : price}</strong>
                    <span className="home-service-details">
                      {t("content:home.services.details")} <b aria-hidden="true">←</b>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
