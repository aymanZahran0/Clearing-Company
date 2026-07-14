import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Table, message } from "antd";
import {
  useListOperatingHoursQuery,
  useReplaceOperatingHoursMutation,
  type OperatingHoursEntry,
} from "../../../api/availabilityApi";

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function defaultRows(): OperatingHoursEntry[] {
  return WEEKDAY_LABELS.map((_, weekday) => ({
    weekday,
    openTime: "09:00",
    closeTime: "18:00",
    active: weekday !== 5, // Friday off by default
  }));
}

// T113 (US4): weekly operating-hours editor.
export default function OperatingHours() {
  const { data, isLoading } = useListOperatingHoursQuery();
  const [replaceOperatingHours, { isLoading: isSaving }] = useReplaceOperatingHoursMutation();
  const [rows, setRows] = useState<OperatingHoursEntry[]>(defaultRows());

  useEffect(() => {
    if (data && data.length > 0) {
      const byWeekday = new Map(data.map((entry) => [entry.weekday, entry]));
      setRows(WEEKDAY_LABELS.map((_, weekday) => byWeekday.get(weekday) ?? defaultRows()[weekday]!));
    }
  }, [data]);

  function updateRow(weekday: number, patch: Partial<OperatingHoursEntry>) {
    setRows((prev) => prev.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  async function onSave() {
    try {
      await replaceOperatingHours(rows).unwrap();
      message.success("Operating hours saved");
    } catch {
      message.error("Could not save operating hours");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Operating Hours</h1>
      <Table
        loading={isLoading}
        rowKey="weekday"
        dataSource={rows}
        pagination={false}
        scroll={{ x: true }}
        columns={[
          { title: "Day", render: (_: unknown, row: OperatingHoursEntry) => WEEKDAY_LABELS[row.weekday] },
          {
            title: "Open",
            render: (_: unknown, row: OperatingHoursEntry) => (
              <Input
                size="large"
                value={row.openTime}
                onChange={(e) => updateRow(row.weekday, { openTime: e.target.value })}
              />
            ),
          },
          {
            title: "Close",
            render: (_: unknown, row: OperatingHoursEntry) => (
              <Input
                size="large"
                value={row.closeTime}
                onChange={(e) => updateRow(row.weekday, { closeTime: e.target.value })}
              />
            ),
          },
          {
            title: "Active",
            render: (_: unknown, row: OperatingHoursEntry) => (
              <Checkbox
                checked={row.active}
                onChange={(e) => updateRow(row.weekday, { active: e.target.checked })}
              />
            ),
          },
        ]}
      />
      <Button type="primary" size="large" className="mt-4" onClick={onSave} loading={isSaving}>
        Save
      </Button>
    </div>
  );
}
