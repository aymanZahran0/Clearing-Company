import { useState } from "react";
import { Button, Form, Input, Radio, Select, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setAddress } from "../../../features/bookingWizard/wizardSlice";
import { useCreateOwnAddressMutation, useListOwnAddressesQuery } from "../../../api/addressesApi";
import { useListServiceAreasQuery } from "../../../api/servicesApi";

interface NewAddressValues {
  city: string;
  neighborhood: string;
  street?: string;
  serviceAreaId: string;
}

export function AddressStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const { data: addresses } = useListOwnAddressesQuery();
  const { data: areas } = useListServiceAreasQuery();
  const [createAddress, { isLoading: isCreating }] = useCreateOwnAddressMutation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selected, setSelected] = useState<string | null>(wizard.addressId);

  async function onCreate(values: NewAddressValues) {
    const created = await createAddress(values).unwrap();
    setSelected(created.id);
    setShowNewForm(false);
  }

  function handleNext() {
    if (!selected) return;
    dispatch(setAddress(selected));
    onNext();
  }

  return (
    <div>
      {addresses && addresses.length > 0 && !showNewForm && (
        <Radio.Group
          onChange={(e) => setSelected(e.target.value)}
          value={selected}
          className="flex flex-col gap-2"
        >
          {addresses.map((address) => (
            <Radio key={address.id} value={address.id} className="block py-2">
              {address.city} — {address.neighborhood} {address.street ?? ""}
            </Radio>
          ))}
        </Radio.Group>
      )}

      {!showNewForm && (
        <Button className="mt-3" onClick={() => setShowNewForm(true)}>
          + New address
        </Button>
      )}

      {showNewForm && (
        <Form<NewAddressValues> layout="vertical" onFinish={onCreate} requiredMark={false} className="mt-3">
          <Form.Item name="serviceAreaId" label="Service Area" rules={[{ required: true }]}>
            <Select
              size="large"
              options={areas?.map((a) => ({
                value: a.id,
                label: i18n.language === "ar" ? a.nameAr : a.nameEn,
              }))}
            />
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="neighborhood" label="Neighborhood" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="street" label="Street">
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={isCreating} block>
            {t("common.save")}
          </Button>
        </Form>
      )}

      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.cancel")}
        </Button>
        <Button type="primary" size="large" disabled={!selected} onClick={handleNext}>
          {t("common.confirm")}
        </Button>
      </Space>
    </div>
  );
}
