import { Button, List, Radio, Space, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setSchedule } from "../../../features/bookingWizard/wizardSlice";
import { useListOwnAddressesQuery } from "../../../api/addressesApi";
import { useGetAvailabilityQuery } from "../../../api/availabilityApi";
import { formatDateTime } from "../../../lib/formatters";

export function ScheduleStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const { data: addresses } = useListOwnAddressesQuery();
  const address = addresses?.find((a) => a.id === wizard.addressId);

  const { data: slots, isLoading } = useGetAvailabilityQuery(
    { serviceId: wizard.serviceId ?? "", serviceAreaId: address?.serviceAreaId ?? "" },
    { skip: !wizard.serviceId || !address }
  );

  function handleSelect(slotId: string, date: string) {
    dispatch(setSchedule({ requestedDate: date, requestedTimeSlotId: slotId }));
  }

  function handleNext() {
    if (wizard.requestedDate) onNext();
  }

  return (
    <div>
      {isLoading && <Skeleton active />}
      <List
        dataSource={slots ?? []}
        renderItem={(slot) => (
          <List.Item>
            <Radio
              checked={wizard.requestedTimeSlotId === slot.id}
              onChange={() => handleSelect(slot.id, slot.date)}
            >
              {t("customer:scheduleStep.slotOption", {
                dateTime: formatDateTime(slot.date, i18n.language),
                startTime: slot.startTime,
                endTime: slot.endTime,
                count: slot.remaining,
              })}
            </Radio>
          </List.Item>
        )}
      />
      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.cancel")}
        </Button>
        <Button type="primary" size="large" disabled={!wizard.requestedDate} onClick={handleNext}>
          {t("common.confirm")}
        </Button>
      </Space>
    </div>
  );
}
