import { useState } from "react";
import { Button, Checkbox, Input, InputNumber, Radio, Skeleton, Tag, message } from "antd";
import {
  useGetChecklistRunQuery,
  useReviewChecklistRunMutation,
  useUpdateChecklistResultsMutation,
  type ChecklistResultInput,
} from "../../../api/checklistsApi";

// T128 (US5): item entry by type, required-item indicators, issue-flag
// control. Answers are staged locally and submitted together so a partial
// fill-in never triggers `completeBooking`'s FR-048 gate prematurely.
export function ChecklistRunner({ bookingId }: { bookingId: string }) {
  const { data: run, isLoading, refetch } = useGetChecklistRunQuery(bookingId);
  const [updateResults, { isLoading: isSaving }] = useUpdateChecklistResultsMutation();
  const [reviewRun] = useReviewChecklistRunMutation();
  const [draft, setDraft] = useState<Record<string, ChecklistResultInput>>({});

  if (isLoading || !run) {
    return <Skeleton active />;
  }

  function valueFor(templateItemId: string) {
    if (draft[templateItemId]) return draft[templateItemId];
    const existing = run!.results.find((r) => r.templateItemId === templateItemId);
    return existing
      ? { templateItemId, value: existing.value, isIssue: existing.isIssue, issueNote: existing.issueNote ?? undefined }
      : { templateItemId };
  }

  function update(templateItemId: string, patch: Partial<ChecklistResultInput>) {
    setDraft((prev) => ({ ...prev, [templateItemId]: { ...valueFor(templateItemId), ...patch } }));
  }

  async function onSave() {
    const results = Object.values(draft);
    if (results.length === 0) {
      message.info("No changes to save");
      return;
    }
    try {
      await updateResults({ bookingId, results }).unwrap();
      setDraft({});
      message.success("Checklist saved");
    } catch {
      message.error("Could not save the checklist");
    }
  }

  async function onReview() {
    try {
      await reviewRun(bookingId).unwrap();
      refetch();
      message.success("Checklist marked as reviewed");
    } catch {
      message.error("Could not mark the checklist reviewed");
    }
  }

  return (
    <div>
      {run.template.items.map((item) => {
        const draftValue = valueFor(item.id);
        return (
          <div key={item.id} className="mb-4 rounded border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-medium">{item.labelEn}</span>
              {item.required && <Tag color="red">Required</Tag>}
            </div>

            {item.type === "YES_NO" && (
              <Radio.Group
                value={draftValue.value}
                onChange={(e) => update(item.id, { value: e.target.value })}
              >
                <Radio.Button value={true}>Yes</Radio.Button>
                <Radio.Button value={false}>No</Radio.Button>
              </Radio.Group>
            )}
            {item.type === "TEXT" && (
              <Input
                size="large"
                value={(draftValue.value as string) ?? ""}
                onChange={(e) => update(item.id, { value: e.target.value })}
              />
            )}
            {item.type === "NUMBER" && (
              <InputNumber
                size="large"
                value={draftValue.value as number}
                onChange={(value) => update(item.id, { value })}
              />
            )}
            {(item.type === "SIGNATURE" || item.type === "ISSUE_FLAG") && (
              <Input
                size="large"
                placeholder={item.type === "SIGNATURE" ? "Signed by" : "Notes"}
                value={(draftValue.value as string) ?? ""}
                onChange={(e) => update(item.id, { value: e.target.value })}
              />
            )}

            <div className="mt-2">
              <Checkbox
                checked={draftValue.isIssue ?? false}
                onChange={(e) => update(item.id, { isIssue: e.target.checked })}
              >
                Flag as issue
              </Checkbox>
              {draftValue.isIssue && (
                <Input.TextArea
                  className="mt-2"
                  placeholder="Issue note"
                  value={draftValue.issueNote ?? ""}
                  onChange={(e) => update(item.id, { issueNote: e.target.value })}
                />
              )}
            </div>
          </div>
        );
      })}

      <div className="flex gap-3">
        <Button type="primary" size="large" onClick={onSave} loading={isSaving}>
          Save Checklist
        </Button>
        {!run.reviewedAt && (
          <Button size="large" onClick={onReview}>
            Mark Reviewed
          </Button>
        )}
      </div>
    </div>
  );
}
