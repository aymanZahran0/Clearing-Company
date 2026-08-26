import { Button, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setSchedule } from "../../../features/bookingWizard/wizardSlice";
import { useListOwnAddressesQuery } from "../../../api/addressesApi";
import { useGetAvailabilityQuery } from "../../../api/availabilityApi";
import { SlotPicker } from "../../../components/SlotPicker";
import { WizardStepCard } from "./WizardStepCard";
import { WizardConfirmButton } from "./WizardConfirmButton";

export function ScheduleStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const { data: addresses } = useListOwnAddressesQuery();
  const address = addresses?.find((a) => a.id === wizard.addressId);

  const { data: slots, isLoading } = useGetAvailabilityQuery(
    { serviceId: wizard.serviceId ?? "", serviceAreaId: address?.serviceAreaId ?? "" },
    { skip: !wizard.serviceId || !address }
  );

  function handleSelect(slotId: string) {
    const slot = slots?.find((s) => s.id === slotId);
    if (!slot) return;
    dispatch(setSchedule({ requestedDate: slot.date, requestedTimeSlotId: slotId }));
  }

  function handleNext() {
    if (wizard.requestedDate) onNext();
  }

  return (
    <WizardStepCard title={t("customer:bookingWizard.steps.schedule")}>
      <SlotPicker
        loading={isLoading}
        value={wizard.requestedTimeSlotId ?? undefined}
        onChange={handleSelect}
        slots={(slots ?? []).map((slot) => ({
          id: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))}
      />
      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.back")}
        </Button>
        <WizardConfirmButton disabled={!wizard.requestedDate} onClick={handleNext}>
          {t("common.confirm")}
        </WizardConfirmButton>
      </Space>
    </WizardStepCard>
  );
}
