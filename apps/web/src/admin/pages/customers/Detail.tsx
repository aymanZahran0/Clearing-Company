import { Descriptions, List, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useGetCustomerQuery } from "../../../api/customersApi";
import { useListAddressesForCustomerQuery } from "../../../api/addressesApi";
import { useListAllBookingsQuery } from "../../../api/bookingsApi";
import { formatCurrency, formatDateTime, formatSaudiPhoneForDisplay } from "../../../lib/formatters";
import { enumLabel } from "../../../lib/enumLabels";
import { SuspendCustomerDialog } from "./SuspendCustomerDialog";
import { ReactivateCustomerDialog } from "./ReactivateCustomerDialog";
import { ViewDetailsLink } from "../../components/ViewDetailsLink";

const STATUS_COLOR: Record<string, string> = { ACTIVE: "green", INVITED: "gold", SUSPENDED: "red" };

// US5 scenario 5: profile summary, addresses, and recent bookings, reusing
// the existing addresses/bookings endpoints (FR-016: no history is
// touched or hidden by suspension).
export default function CustomerDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, refetch } = useGetCustomerQuery(id ?? "", { skip: !id });
  const { data: addresses } = useListAddressesForCustomerQuery(id ?? "", { skip: !id });
  const { data: bookings } = useListAllBookingsQuery({ customerId: id, pageSize: 10 }, { skip: !id });

  if (isLoading || !customer) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Link to="/admin/customers" className="mb-4 inline-block">
        {t("admin:customers.backToList")}
      </Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{customer.fullName}</h1>
        {customer.status === "SUSPENDED" ? (
          <ReactivateCustomerDialog customerId={customer.id} onDone={refetch} />
        ) : (
          <SuspendCustomerDialog customerId={customer.id} onDone={refetch} />
        )}
      </div>

      <h2 className="mb-2 text-base font-medium">{t("admin:customers.profileSummary")}</h2>
      <Descriptions column={1} bordered size="middle" className="mb-6">
        <Descriptions.Item label={t("admin:customers.phone")}>
          {customer.phone ? formatSaudiPhoneForDisplay(customer.phone) : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:customers.email")}>{customer.email ?? "—"}</Descriptions.Item>
        <Descriptions.Item label={t("admin:customers.status")}>
          <Tag color={STATUS_COLOR[customer.status]}>{enumLabel("userStatus", customer.status)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:customers.createdAt")}>
          {formatDateTime(customer.createdAt, i18n.language)}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:customers.lastLogin")}>
          {customer.lastLoginAt ? formatDateTime(customer.lastLoginAt, i18n.language) : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:customers.bookingsCount")}>{customer.bookingsCount}</Descriptions.Item>
      </Descriptions>

      <h2 className="mb-2 text-base font-medium">{t("admin:customers.addresses")}</h2>
      <List
        className="mb-6"
        dataSource={addresses}
        locale={{ emptyText: t("admin:customers.noAddresses") }}
        renderItem={(address) => (
          <List.Item>
            {address.city} — {address.neighborhood} {address.street ?? ""}
          </List.Item>
        )}
      />

      <h2 className="mb-2 text-base font-medium">{t("admin:customers.recentBookings")}</h2>
      <List
        dataSource={bookings?.items}
        locale={{ emptyText: t("admin:customers.noBookings") }}
        renderItem={(booking) => (
          <List.Item
            actions={[
              <ViewDetailsLink key="view" to={`/admin/bookings/${booking.id}`} />,
            ]}
          >
            <span>
              {booking.referenceNumber} — <Tag>{enumLabel("bookingStatus", booking.status)}</Tag>{" "}
              {booking.totalSnapshot != null ? formatCurrency(booking.totalSnapshot, i18n.language) : ""}
            </span>
          </List.Item>
        )}
      />
    </div>
  );
}
