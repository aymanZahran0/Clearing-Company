import { useState } from "react";
import { Button, Form, Input, Radio, Select, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setAddress } from "../../../features/bookingWizard/wizardSlice";
import { useCreateOwnAddressMutation, useListOwnAddressesQuery } from "../../../api/addressesApi";
import { useListServiceAreasQuery } from "../../../api/servicesApi";
import { WizardStepCard } from "./WizardStepCard";
import { WizardConfirmButton } from "./WizardConfirmButton";

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
    <WizardStepCard title={t("customer:bookingWizard.steps.address")}>
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
          {t("customer:addressStep.newAddress")}
        </Button>
      )}

      {showNewForm && (
        <Form<NewAddressValues>
          layout="vertical"
          onFinish={onCreate}
          requiredMark={false}
          className="wizard-form mt-3"
        >
          <Form.Item name="serviceAreaId" label={t("customer:addressStep.serviceArea")} rules={[{ required: true }]}>
            <Select
              size="large"
              options={areas?.map((a) => ({
                value: a.id,
                label: i18n.language.startsWith("ar") ? a.nameAr : a.nameEn,
              }))}
            />
          </Form.Item>
          <Form.Item name="city" label={t("customer:addressStep.city")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="neighborhood" label={t("customer:addressStep.neighborhood")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="street" label={t("customer:addressStep.street")}>
            <Input size="large" />
          </Form.Item>
          <WizardConfirmButton htmlType="submit" loading={isCreating} block>
            {t("common.save")}
          </WizardConfirmButton>
        </Form>
      )}

      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.cancel")}
        </Button>
        <WizardConfirmButton disabled={!selected} onClick={handleNext}>
          {t("common.confirm")}
        </WizardConfirmButton>
      </Space>
    </WizardStepCard>
  );
}
