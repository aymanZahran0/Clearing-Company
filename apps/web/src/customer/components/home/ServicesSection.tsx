import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Skeleton } from "antd";
import { useListServicesQuery, type Service } from "../../../api/servicesApi";
import { formatCurrency } from "../../../lib/formatters";
import { Reveal } from "./HomeMotion";
import defaultServiceImage from "../../../assets/logo/logo-without-name.png";

const MAX_SERVICES_SHOWN = 6;

function getServicePrice(service: Service, language: string, customQuoteLabel: string) {
  const price = service.basePrice ?? service.minimumPrice;
  if (price == null) return customQuoteLabel;
  return formatCurrency(price, language);
}

// US1 scenario 2: active services from the existing services API — no
// business content duplicated in code (FR-006).
export function ServicesSection() {
  const { t, i18n } = useTranslation();
  const { data: services, isLoading } = useListServicesQuery();
  const activeServices = (services ?? []).filter((service) => service.active).slice(0, MAX_SERVICES_SHOWN);

  if (!isLoading && activeServices.length === 0) return null;

  return (
    <section className="home-section home-services px-4 sm:px-6" aria-labelledby="home-services-title">
      <Reveal>
        <div className="mx-auto max-w-7xl">
          <div className="home-services-header">
            <div>
              <p className="home-services-label">{t("content:home.services.title")}</p>
              <h2 id="home-services-title" className="home-section-title">
                {t("content:home.services.headline")}
              </h2>
            </div>
            <Link to="/services" className="home-services-view-all">
              {t("content:home.services.viewAll")}
            </Link>
          </div>

          {isLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : (
            <div className="home-services-grid">
              {activeServices.map((service) => {
                const description = service.descriptionAr;
                const price = getServicePrice(service, i18n.language, t("content:home.services.customQuote"));
                const serviceImage = service.images[0];
                return (
                  <Link
                    to={`/services/${service.slug}`}
                    className="home-service-card"
                    key={service.id}
                    aria-label={`${service.nameAr} — ${t("content:home.services.details")}`}
                  >
                    <div className="home-service-media">
                      <img
                        src={serviceImage?.url || defaultServiceImage}
                        alt={serviceImage?.altTextAr || service.nameAr}
                        className={serviceImage ? undefined : "is-fallback"}
                      />
                    </div>
                    <h3>{service.nameAr}</h3>
                    {description && <p>{description}</p>}
                    <div className="home-service-card-footer">
                      <strong>
                        {service.minimumPrice != null || service.basePrice != null
                          ? t("content:home.services.startsAt", { price })
                          : price}
                      </strong>
                      <span className="home-service-details">{t("content:home.services.details")} <b aria-hidden="true">←</b></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
