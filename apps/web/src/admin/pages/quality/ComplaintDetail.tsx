import { useState } from "react";
import { Button, Descriptions, Input, Select, Skeleton, Tag, message } from "antd";
import { useParams } from "react-router-dom";
import {
  useGetQualityIssueQuery,
  useUpdateQualityIssueMutation,
  type QualityIssueStatus,
} from "../../../api/qualityIssuesApi";
import { ReworkDialog } from "./ReworkDialog";

const STATUSES: QualityIssueStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

// T142 (US6): categorize/resolve/close a quality issue; FR-052 requires a
// resolution before CLOSED (enforced server-side, surfaced here too).
export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: issue, isLoading, refetch } = useGetQualityIssueQuery(id ?? "", { skip: !id });
  const [updateIssue, { isLoading: isSaving }] = useUpdateQualityIssueMutation();
  const [resolution, setResolution] = useState("");

  if (isLoading || !issue) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  async function onStatusChange(status: QualityIssueStatus) {
    if (status === "CLOSED" && !resolution && !issue!.resolution) {
      message.error("A resolution is required before closing this issue");
      return;
    }
    try {
      await updateIssue({ id: issue!.id, status, resolution: resolution || undefined }).unwrap();
      refetch();
      message.success("Updated");
    } catch {
      message.error("Could not update this quality issue");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Quality Issue</h1>
      <Descriptions column={1} bordered size="middle" className="mb-6">
        <Descriptions.Item label="Source">
          <Tag>{issue.source}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Category">{issue.category}</Descriptions.Item>
        <Descriptions.Item label="Severity">
          <Tag>{issue.severity}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag>{issue.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Description">{issue.description}</Descriptions.Item>
        <Descriptions.Item label="Resolution">{issue.resolution ?? "—"}</Descriptions.Item>
      </Descriptions>

      <div className="mb-4">
        <Input.TextArea
          placeholder="Resolution (required before closing)"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={3}
          className="mb-3"
        />
        <Select
          size="large"
          className="w-full sm:w-64"
          placeholder="Change status"
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          loading={isSaving}
          onChange={onStatusChange}
        />
      </div>

      {!issue.reworkBookingId && (
        <div className="mb-6">
          <ReworkDialog qualityIssueId={issue.id} />
        </div>
      )}
    </div>
  );
}
