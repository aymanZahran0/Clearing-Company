import { Link } from "react-router-dom";
import { Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useListServicesQuery, type Service } from "../../../api/servicesApi";

// T048 (US4/FR-024): per-service completeness overview — pricing
// configured, image added, activated — each deep-linking to the step that
// needs attention. Deliberately checks only what's already available on
// the Service payload (no extra per-service queries) to keep this a single
// cheap request rather than N+1 fan-out across every catalog item.
function hasPricing(svc: Service): boolean {
  return svc.basePrice != null || svc.pricingType === "CUSTOM_QUOTE";
}

export default function CatalogChecklist() {
  const { t } = useTranslation();
  const { data, isLoading } = useListServicesQuery({ includeInactive: true });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("catalog:checklistTitle")}</h1>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          { title: t("admin:content.titleAr"), dataIndex: "nameAr" },
          {
            title: t("catalog:pricingConfigured"),
            render: (_: unknown, row: Service) =>
              hasPricing(row) ? (
                <Tag color="green">{t("admin:common.active")}</Tag>
              ) : (
                <Link to="/admin/pricing/rules">
                  <Tag color="orange">{t("catalog:needsAttention")}</Tag>
                </Link>
              ),
          },
          {
            title: t("admin:serviceImages.title"),
            render: (_: unknown, row: Service) =>
              row.images.length > 0 ? (
                <Tag color="green">{t("admin:common.active")}</Tag>
              ) : (
                <Link to={`/admin/catalog/services/${row.slug}/images`}>
                  <Tag color="orange">{t("catalog:needsAttention")}</Tag>
                </Link>
              ),
          },
          {
            title: t("admin:common.active"),
            render: (_: unknown, row: Service) =>
              row.active ? (
                <Tag color="green">{t("admin:common.active")}</Tag>
              ) : (
                <Link to="/admin/catalog/services">
                  <Tag color="orange">{t("catalog:needsAttention")}</Tag>
                </Link>
              ),
          },
        ]}
      />
    </div>
  );
}
