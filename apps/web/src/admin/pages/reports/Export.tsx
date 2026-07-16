import { useState } from "react";
import { Button, Checkbox, DatePicker, message } from "antd";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";

const { RangePicker } = DatePicker;

// T165 (US8): CSV export with PII-field exclusion by default (FR-073/
// FR-074). Uses a direct `fetch` (not RTK Query) since the response is a
// file download, not JSON.
export default function Export() {
  const { t } = useTranslation();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [includePii, setIncludePii] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function onExport() {
    setIsDownloading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";
      const params = new URLSearchParams();
      if (range) {
        params.set("from", range[0].toISOString());
        params.set("to", range[1].toISOString());
      }
      params.set("includePii", String(includePii));

      const response = await fetch(`${baseUrl}/reports/export.csv?${params.toString()}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bookings-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error(t("admin:reports.exportError"));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:reports.exportBookingsTitle")}</h1>
      <RangePicker
        size="large"
        className="mb-4"
        onChange={(values) => setRange(values && values[0] && values[1] ? [values[0], values[1]] : null)}
      />
      <div className="mb-4">
        <Checkbox checked={includePii} onChange={(e) => setIncludePii(e.target.checked)}>
          {t("admin:reports.includePii")}
        </Checkbox>
      </div>
      <Button type="primary" size="large" loading={isDownloading} onClick={onExport}>
        {t("admin:reports.downloadCsv")}
      </Button>
    </div>
  );
}
