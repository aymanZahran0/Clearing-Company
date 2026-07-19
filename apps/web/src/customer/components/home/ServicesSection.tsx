import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Col, Row, Skeleton, Button } from "antd";
import { useListServicesQuery } from "../../../api/servicesApi";
import { formatCurrency } from "../../../lib/formatters";

const MAX_SERVICES_SHOWN = 6;

// US1 scenario 2: active services from the existing services API — no
// business content duplicated in code (FR-006).
export function ServicesSection() {
  const { t, i18n } = useTranslation();
  const { data: services, isLoading } = useListServicesQuery();
  const isAr = i18n.language === "ar";
  const activeServices = (services ?? []).filter((s) => s.active).slice(0, MAX_SERVICES_SHOWN);

  if (!isLoading && activeServices.length === 0) return null;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("content:home.services.title")}</h2>
          <Link to="/services">
            <Button>{t("content:home.services.viewAll")}</Button>
          </Link>
        </div>
        {isLoading && <Skeleton active />}
        <Row gutter={[16, 16]}>
          {activeServices.map((service) => (
            <Col xs={24} sm={12} md={8} key={service.id}>
              <Link to={`/services/${service.slug}`}>
                <Card
                  hoverable
                  cover={
                    service.images[0] ? (
                      <img
                        src={service.images[0].url}
                        alt={isAr ? service.images[0].altTextAr ?? "" : service.images[0].altTextEn ?? ""}
                        loading="lazy"
                        className="h-40 w-full object-cover"
                      />
                    ) : undefined
                  }
                >
                  <Card.Meta
                    title={isAr ? service.nameAr : service.nameEn}
                    description={
                      service.basePrice != null ? formatCurrency(service.basePrice, i18n.language) : t("common:common.confirm")
                    }
                  />
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
