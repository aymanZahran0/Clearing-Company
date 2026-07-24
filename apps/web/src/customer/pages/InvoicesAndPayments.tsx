import { List, Skeleton, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { useListOwnInvoicesQuery } from "../../api/paymentsApi";
import { formatCurrency, formatDate } from "../../lib/formatters";

// Single batched request instead of one useGetInvoiceQuery per completed
// booking — the API creates any missing invoice server-side in the same
// call, so the customer always sees one invoice per completed booking
// without the client paying for N round-trips to get there.
export default function InvoicesAndPayments() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useListOwnInvoicesQuery();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold text-ink">{t("nav.bookings")}</h1>
      {isLoading && <Skeleton active />}
      {!isLoading && data?.length === 0 && (
        <Empty description={t("customer:invoices.emptyTitle")} />
      )}
      {!isLoading && data && data.length > 0 && (
        <List
          dataSource={data}
          renderItem={(invoice) => (
            <List.Item>
              <span>{invoice.invoiceNumber}</span>
              <span>{formatCurrency(invoice.total, i18n.language)}</span>
              <span>{formatDate(invoice.issuedAt, i18n.language)}</span>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
