import { Card, Col, Row, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useListServiceAreasQuery } from "../../api/servicesApi";
import { formatCurrency } from "../../lib/formatters";

// T054 (US5): public, prerender-eligible page listing where the company
// currently operates. GET /service-areas already excludes disabled areas
// server-side (apps/api/src/modules/service-areas — verified by
// tests/integration/serviceArea.test.ts).
export default function ServiceAreas() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListServiceAreasQuery();
  const isAr = i18n.language.startsWith("ar");

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mobile-type-page-title mb-4 text-2xl font-bold">{t("content:serviceAreas.title")}</h1>
      {isLoading && <Skeleton active />}
      <Row gutter={[16, 16]}>
        {data?.map((area) => (
          <Col xs={24} sm={12} md={8} key={area.id}>
            <Card>
              <Card.Meta
                title={isAr ? area.nameAr : area.nameEn || area.nameAr}
                description={
                  area.travelFee > 0
                    ? t("content:serviceAreas.travelFee", { amount: formatCurrency(area.travelFee, i18n.language) })
                    : t("content:serviceAreas.noTravelFee")
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
