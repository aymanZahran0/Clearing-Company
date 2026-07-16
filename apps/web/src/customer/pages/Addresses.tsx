import { Button, List, Popconfirm, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useDeleteOwnAddressMutation, useListOwnAddressesQuery } from "../../api/addressesApi";

export default function Addresses() {
  const { t } = useTranslation();
  const { data: addresses, isLoading } = useListOwnAddressesQuery();
  const [deleteAddress] = useDeleteOwnAddressMutation();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("customer:addresses.title")}</h1>
      {isLoading && <Skeleton active />}
      <List
        dataSource={addresses}
        renderItem={(address) => (
          <List.Item
            actions={[
              <Popconfirm
                key="delete"
                title={t("common.cancel")}
                onConfirm={() => deleteAddress(address.id)}
              >
                <Button danger size="small">
                  {t("common.cancel")}
                </Button>
              </Popconfirm>,
            ]}
          >
            {address.label ? `${address.label}: ` : ""}
            {address.city}, {address.neighborhood} {address.street ?? ""}
          </List.Item>
        )}
      />
    </div>
  );
}
