import { List, Skeleton, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { useListOwnBookingsQuery } from "../../api/bookingsApi";
import { useGetInvoiceQuery } from "../../api/paymentsApi";
import { formatCurrency, formatDate } from "../../lib/formatters";

function InvoiceRow({ bookingId }: { bookingId: string }) {
  const { i18n } = useTranslation();
  const { data: invoice } = useGetInvoiceQuery(bookingId);
  if (!invoice) return null;
  return (
    <List.Item>
      <span>{invoice.invoiceNumber}</span>
      <span>{formatCurrency(invoice.total, i18n.language)}</span>
      <span>{formatDate(invoice.issuedAt, i18n.language)}</span>
    </List.Item>
  );
}

export default function InvoicesAndPayments() {
  const { t } = useTranslation();
  const { data, isLoading } = useListOwnBookingsQuery({ status: "COMPLETED" });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.bookings")}</h1>
      {isLoading && <Skeleton active />}
      {!isLoading && data?.items.length === 0 && <Empty />}
      <List dataSource={data?.items} renderItem={(b) => <InvoiceRow key={b.id} bookingId={b.id} />} />
    </div>
  );
}
