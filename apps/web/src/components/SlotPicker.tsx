import { useEffect, useMemo, useState } from "react";
import { Calendar, Empty, Select, Skeleton } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

export interface SlotPickerOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  disabled?: boolean;
  /** e.g. "(2/3)" — shown under the start time when provided. */
  spotsLabel?: string;
}

interface SlotPickerProps {
  slots: SlotPickerOption[];
  value?: string;
  onChange?: (slotId: string) => void;
  loading?: boolean;
}

// Pick a day on a compact month grid (days with availability are dotted),
// then choose its start time from a standard select field. Used by both the Admin
// schedule/reschedule dialogs and the Customer booking wizard / reschedule
// request so the picking experience is consistent everywhere a time slot is
// chosen.
export function SlotPicker({ slots, value, onChange, loading }: SlotPickerProps) {
  const { t } = useTranslation();

  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotPickerOption[]>();
    for (const slot of slots) {
      const key = dayjs(slot.date).format("YYYY-MM-DD");
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [slots]);

  const selectedSlot = slots.find((slot) => slot.id === value);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    selectedSlot ? dayjs(selectedSlot.date) : null
  );

  // Once slots have loaded, default to the first day that has an available
  // slot instead of leaving the panel on today (which is usually empty).
  useEffect(() => {
    if (selectedDate || slots.length === 0) return;
    const firstAvailableKey = [...slotsByDate.entries()].find(([, list]) =>
      list.some((slot) => !slot.disabled)
    )?.[0];
    if (firstAvailableKey) setSelectedDate(dayjs(firstAvailableKey));
  }, [slots, slotsByDate, selectedDate]);

  function hasAvailability(date: Dayjs): boolean {
    const list = slotsByDate.get(date.format("YYYY-MM-DD"));
    return !!list?.some((slot) => !slot.disabled);
  }

  const daySlots = selectedDate ? (slotsByDate.get(selectedDate.format("YYYY-MM-DD")) ?? []) : [];

  if (loading) return <Skeleton active />;

  return (
    <div>
      <Calendar
        fullscreen={false}
        value={selectedDate ?? undefined}
        disabledDate={(date) => !hasAvailability(date)}
        onSelect={(date) => setSelectedDate(date)}
        cellRender={(date, info) =>
          info.type === "date" && hasAvailability(date) ? (
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-green-600"
            />
          ) : null
        }
        className="slot-picker-calendar overflow-hidden rounded-lg border border-hairline"
      />
      <div className="mt-4">
        <div className="mb-2 text-sm font-medium text-muted">
          {t("slotPicker.availableTimes")}
        </div>
        {selectedDate && daySlots.length === 0 && (
          <Empty description={t("slotPicker.noSlotsForDate")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {!selectedDate && slots.length === 0 && (
          <Empty description={t("slotPicker.noSlotsAvailable")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {daySlots.length > 0 && (
          <Select
            size="large"
            className="w-full"
            aria-label={t("slotPicker.selectTime")}
            value={daySlots.some((slot) => slot.id === value) ? value : undefined}
            placeholder={t("slotPicker.selectTime")}
            onChange={(slotId) => onChange?.(slotId)}
            options={daySlots.map((slot) => ({
              value: slot.id,
              label: slot.startTime,
              disabled: slot.disabled,
            }))}
          />
        )}
      </div>
    </div>
  );
}
