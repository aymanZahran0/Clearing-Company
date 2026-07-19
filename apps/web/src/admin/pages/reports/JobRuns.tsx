import { useState } from "react";
import { Select, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useListJobRunsQuery, type JobName, type JobRunStatus } from "../../../api/jobRunsApi";
import { formatDateTime } from "../../../lib/formatters";

const STATUS_COLOR: Record<JobRunStatus, string> = {
  SUCCESS: "green",
  FAILURE: "red",
  SKIPPED_LOCKED: "orange",
};

const JOB_NAME_LABEL_KEYS: Record<JobName, string> = {
  EXPIRE_STALE_QUOTES: "admin:jobRuns.expireStaleQuotes",
  FLAG_OVERDUE_BOOKINGS: "admin:jobRuns.flagOverdueBookings",
  GENERATE_SUBSCRIPTION_OCCURRENCES: "admin:jobRuns.generateSubscriptionOccurrences",
};

const JOB_STATUS_LABEL_KEYS: Record<JobRunStatus, string> = {
  SUCCESS: "admin:jobRuns.success",
  FAILURE: "admin:jobRuns.failure",
  SKIPPED_LOCKED: "admin:jobRuns.skippedLocked",
};

export default function JobRuns() {
  const { t, i18n } = useTranslation();
  const [jobName, setJobName] = useState<JobName | undefined>();
  const [status, setStatus] = useState<JobRunStatus | undefined>();
  const { data, isLoading } = useListJobRunsQuery({ jobName, status });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:jobRuns.title")}</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          allowClear
          size="large"
          className="w-full sm:w-64"
          placeholder={t("admin:jobRuns.filterByJob")}
          value={jobName}
          onChange={setJobName}
          options={[
            { value: "EXPIRE_STALE_QUOTES", label: t("admin:jobRuns.expireStaleQuotes") },
            { value: "FLAG_OVERDUE_BOOKINGS", label: t("admin:jobRuns.flagOverdueBookings") },
            { value: "GENERATE_SUBSCRIPTION_OCCURRENCES", label: t("admin:jobRuns.generateSubscriptionOccurrences") },
          ]}
        />
        <Select
          allowClear
          size="large"
          className="w-full sm:w-48"
          placeholder={t("admin:jobRuns.filterByStatus")}
          value={status}
          onChange={setStatus}
          options={[
            { value: "SUCCESS", label: t("admin:jobRuns.success") },
            { value: "FAILURE", label: t("admin:jobRuns.failure") },
            { value: "SKIPPED_LOCKED", label: t("admin:jobRuns.skippedLocked") },
          ]}
        />
      </div>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        pagination={{ total: data?.total, pageSize: data?.pageSize }}
        columns={[
          {
            title: t("admin:jobRuns.job"),
            dataIndex: "jobName",
            render: (value: JobName) => t(JOB_NAME_LABEL_KEYS[value]),
          },
          {
            title: t("admin:jobRuns.status"),
            dataIndex: "status",
            render: (value: JobRunStatus) => (
              <Tag color={STATUS_COLOR[value]}>{t(JOB_STATUS_LABEL_KEYS[value])}</Tag>
            ),
          },
          {
            title: t("admin:jobRuns.startedAt"),
            dataIndex: "startedAt",
            render: (value: string) => formatDateTime(value, i18n.language),
          },
          {
            title: t("admin:jobRuns.finishedAt"),
            dataIndex: "finishedAt",
            render: (value: string | null) => (value ? formatDateTime(value, i18n.language) : "—"),
          },
          { title: t("admin:jobRuns.failureReason"), dataIndex: "failureReason", render: (value: string | null) => value ?? "—" },
        ]}
      />
    </div>
  );
}
