import { Card, Col, Row, Skeleton, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useListServicesQuery } from "../../api/servicesApi";
import { formatCurrency } from "../../lib/formatters";

// Public, prerender-eligible route (research.md R9).
export default function ServiceCatalog() {
  const { t, i18n } = useTranslation();
  const { data: services, isLoading } = useListServicesQuery();
  const isAr = i18n.language === "ar";

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold">{t("nav.services")}</h1>
      {isLoading && <Skeleton active />}
      {!isLoading && services?.length === 0 && <Empty />}
      <Row gutter={[16, 16]}>
        {services?.map((service) => (
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
                    service.basePrice != null
                      ? formatCurrency(service.basePrice, i18n.language)
                      : t("common.confirm")
                  }
                />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
