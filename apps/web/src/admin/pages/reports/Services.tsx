import { Table } from "antd";
import { useTranslation } from "react-i18next";
import { useGetServicesReportQuery } from "../../../api/reportsApi";
import { formatCurrency } from "../../../lib/formatters";

// T165 (US8)
export default function Services() {
  const { i18n } = useTranslation();
  const { data, isLoading } = useGetServicesReportQuery();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Services Report</h1>
      <Table
        loading={isLoading}
        rowKey="nameEn"
        dataSource={data}
        scroll={{ x: true }}
        columns={[
          {
            title: "Service",
            render: (_: unknown, row: { nameAr: string; nameEn: string }) =>
              i18n.language === "ar" ? row.nameAr : row.nameEn,
          },
          { title: "Completed Bookings", dataIndex: "count" },
          {
            title: "Revenue",
            dataIndex: "revenue",
            render: (value: number) => formatCurrency(value, i18n.language),
          },
        ]}
      />
    </div>
  );
}
