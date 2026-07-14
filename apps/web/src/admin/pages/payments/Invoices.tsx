import { List, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useListPaymentsQuery } from "../../../api/paymentsApi";
import { formatCurrency, formatDateTime } from "../../../lib/formatters";

export function PaymentsList({ bookingId }: { bookingId: string }) {
  const { i18n } = useTranslation();
  const { data: payments, isLoading } = useListPaymentsQuery(bookingId);

  if (isLoading) return <Skeleton active />;

  return (
    <List
      dataSource={payments}
      renderItem={(payment) => (
        <List.Item>
          <span>{payment.method}</span>
          <span>{formatCurrency(payment.amount, i18n.language)}</span>
          <span>{payment.paidAt ? formatDateTime(payment.paidAt, i18n.language) : "—"}</span>
        </List.Item>
      )}
    />
  );
}
