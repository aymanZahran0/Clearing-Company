import { useState } from "react";
import { Button, Card, Checkbox, DatePicker, Form, message } from "antd";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";

const { RangePicker } = DatePicker;

// T165 (US8): Excel export with PII-field exclusion by default (FR-073/
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

      const response = await fetch(`${baseUrl}/reports/export.xlsx?${params.toString()}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "تصدير-الحجوزات.xlsx";
      link.click();
      URL.revokeObjectURL(url);
      message.success(t("admin:reports.exportSuccess"));
    } catch {
      message.error(t("admin:reports.exportError"));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-xl font-semibold">{t("admin:reports.exportBookingsTitle")}</h1>
      <p className="mb-4 max-w-prose text-sm text-gray-500">{t("admin:reports.exportDescription")}</p>
      <Card className="max-w-xl">
        <Form layout="vertical">
          <Form.Item label={t("admin:reports.dateRangeLabel")} help={t("admin:reports.dateRangeHelp")}>
            <RangePicker
              size="large"
              className="w-full"
              onChange={(values) => setRange(values && values[0] && values[1] ? [values[0], values[1]] : null)}
            />
          </Form.Item>
          <Form.Item className="mb-4">
            <Checkbox checked={includePii} onChange={(e) => setIncludePii(e.target.checked)}>
              {t("admin:reports.includePii")}
            </Checkbox>
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" size="large" loading={isDownloading} onClick={onExport}>
              {t("admin:reports.downloadExcel")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
