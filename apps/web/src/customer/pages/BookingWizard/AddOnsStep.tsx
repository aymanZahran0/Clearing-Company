import { Button, Checkbox, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setAddOnIds } from "../../../features/bookingWizard/wizardSlice";
import { useListServicesQuery } from "../../../api/servicesApi";
import { formatCurrency } from "../../../lib/formatters";
import { WizardStepCard } from "./WizardStepCard";
import { WizardConfirmButton } from "./WizardConfirmButton";

export function AddOnsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const { data: services } = useListServicesQuery();
  const service = services?.find((s) => s.id === wizard.serviceId);

  function handleNext(selected: string[]) {
    dispatch(setAddOnIds(selected));
    onNext();
  }

  return (
    <WizardStepCard title={t("customer:bookingWizard.steps.addOns")}>
      <Checkbox.Group
        className="flex flex-col gap-3"
        defaultValue={wizard.addOnIds}
        onChange={(values) => dispatch(setAddOnIds(values as string[]))}
      >
        {service?.addOns.map((addOn) => (
          <Checkbox key={addOn.id} value={addOn.id} className="flex items-center justify-between">
            <span>
              {i18n.language.startsWith("ar") ? addOn.nameAr : addOn.nameEn} —{" "}
              {formatCurrency(addOn.unitPrice, i18n.language)}
            </span>
          </Checkbox>
        ))}
      </Checkbox.Group>
      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.back")}
        </Button>
        <WizardConfirmButton onClick={() => handleNext(wizard.addOnIds)}>
          {t("common.confirm")}
        </WizardConfirmButton>
      </Space>
    </WizardStepCard>
  );
}
