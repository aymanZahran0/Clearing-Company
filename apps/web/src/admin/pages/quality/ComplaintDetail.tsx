import { useState } from "react";
import { Descriptions, Input, Select, Skeleton, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { formatDateTime } from "../../../lib/formatters";
import {
  useGetQualityIssueQuery,
  useUpdateQualityIssueMutation,
  type QualityIssueStatus,
} from "../../../api/qualityIssuesApi";
import { enumLabel } from "../../../lib/enumLabels";
import { enumOptions } from "../../../lib/enumOptions";

const STATUSES: QualityIssueStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

export default function ComplaintDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: issue, isLoading, refetch } = useGetQualityIssueQuery(id ?? "", { skip: !id });
  const [updateIssue, { isLoading: saving }] = useUpdateQualityIssueMutation();
  const [resolution, setResolution] = useState("");

  if (isLoading || !issue) return <div className="p-6"><Skeleton active /></div>;

  async function changeStatus(status: QualityIssueStatus) {
    if (status === "CLOSED" && !resolution && !issue?.resolution) {
      message.error(t("admin:quality.resolutionRequired"));
      return;
    }
    try {
      await updateIssue({ id: issue!.id, status, resolution: resolution || undefined }).unwrap();
      await refetch();
      message.success(t("admin:quality.updated"));
    } catch {
      // Global API middleware displays the error.
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:quality.qualityIssue")}</h1>
      <Descriptions column={1} bordered className="mb-6">
        <Descriptions.Item label={t("admin:quality.bookingReference")}>
          <Link to={`/admin/bookings/${issue.bookingId}`}>{issue.booking.referenceNumber}</Link>
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.customerName")}>
          {issue.booking.customer.user.fullName}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.phone")}>
          {issue.booking.customer.user.phoneNormalized ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.email")}>
          {issue.booking.customer.user.email ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.service")}>
          {issue.booking.items[0]?.service.nameAr ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.serviceDate")}>
          {formatDateTime(
            issue.booking.scheduledStartAt ?? issue.booking.preferredDate,
            i18n.language
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.address")}>
          {issue.booking.address
            ? [issue.booking.address.city, issue.booking.address.neighborhood, issue.booking.address.street]
                .filter(Boolean)
                .join("، ")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.category")}>
          {t(`customer:complaintForm.categories.${issue.category}`)}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.severity")}><Tag>{enumLabel("qualityIssueSeverity", issue.severity)}</Tag></Descriptions.Item>
        <Descriptions.Item label={t("admin:bookings.status")}><Tag>{enumLabel("qualityIssueStatus", issue.status)}</Tag></Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.description")}>{issue.description}</Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.resolution")}>{issue.resolution ?? "-"}</Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.submittedAt")}>
          {formatDateTime(issue.createdAt, i18n.language)}
        </Descriptions.Item>
        <Descriptions.Item label={t("admin:quality.updatedAt")}>
          {formatDateTime(issue.updatedAt, i18n.language)}
        </Descriptions.Item>
      </Descriptions>
      <Input.TextArea
        rows={3}
        className="mb-3"
        value={resolution}
        placeholder={t("admin:quality.resolutionPlaceholder")}
        onChange={(event) => setResolution(event.target.value)}
      />
      <Select
        size="large"
        className="w-full sm:w-64"
        loading={saving}
        placeholder={t("admin:quality.changeStatus")}
        options={enumOptions("qualityIssueStatus", STATUSES)}
        onChange={changeStatus}
      />
    </div>
  );
}
