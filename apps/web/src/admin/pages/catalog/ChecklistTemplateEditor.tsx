import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Select, Table, message } from "antd";
import { useParams } from "react-router-dom";
import {
  useGetChecklistTemplateQuery,
  useUpsertChecklistTemplateMutation,
  type ChecklistItemType,
  type ChecklistTemplateItem,
} from "../../../api/checklistsApi";

const ITEM_TYPES: ChecklistItemType[] = ["YES_NO", "TEXT", "NUMBER", "SIGNATURE", "ISSUE_FLAG"];

type DraftItem = Omit<ChecklistTemplateItem, "id">;

// T127 (US5): checklist-template editor for a service. There is no broader
// catalog admin section (List/ServiceEditor screens) built yet — this page
// stands alone under admin/pages/catalog/ so it's ready to be linked from
// one once that catalog UI ships, rather than blocking the checklist
// feature on unrelated scope.
export default function ChecklistTemplateEditor() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { data, isLoading } = useGetChecklistTemplateQuery(serviceId ?? "", { skip: !serviceId });
  const [upsertTemplate, { isLoading: isSaving }] = useUpsertChecklistTemplateMutation();
  const [items, setItems] = useState<DraftItem[]>([]);

  useEffect(() => {
    if (data) {
      setItems(data.items.map(({ id: _id, ...rest }) => rest));
    }
  }, [data]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { labelAr: "", labelEn: "", type: "YES_NO", required: true, sortOrder: prev.length + 1 },
    ]);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSave() {
    if (!serviceId) return;
    if (items.length === 0) {
      message.error("Add at least one checklist item");
      return;
    }
    try {
      await upsertTemplate({ serviceId, items }).unwrap();
      message.success(`Published version ${(data?.version ?? 0) + 1}`);
    } catch {
      message.error("Could not publish the checklist template");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Checklist Template</h1>
      {!isLoading && data && <p className="mb-4 text-sm text-gray-500">Current version: {data.version}</p>}
      <Table
        rowKey={(_, index) => String(index)}
        dataSource={items}
        pagination={false}
        scroll={{ x: true }}
        columns={[
          {
            title: "Label (Arabic)",
            render: (_: unknown, row: DraftItem, index: number) => (
              <Input value={row.labelAr} onChange={(e) => updateItem(index, { labelAr: e.target.value })} />
            ),
          },
          {
            title: "Label (English)",
            render: (_: unknown, row: DraftItem, index: number) => (
              <Input value={row.labelEn} onChange={(e) => updateItem(index, { labelEn: e.target.value })} />
            ),
          },
          {
            title: "Type",
            render: (_: unknown, row: DraftItem, index: number) => (
              <Select
                value={row.type}
                options={ITEM_TYPES.map((t) => ({ value: t, label: t }))}
                onChange={(type) => updateItem(index, { type })}
                className="w-36"
              />
            ),
          },
          {
            title: "Required",
            render: (_: unknown, row: DraftItem, index: number) => (
              <Checkbox
                checked={row.required}
                onChange={(e) => updateItem(index, { required: e.target.checked })}
              />
            ),
          },
          {
            title: "",
            render: (_: unknown, __: DraftItem, index: number) => (
              <Button danger onClick={() => removeItem(index)}>
                Remove
              </Button>
            ),
          },
        ]}
      />
      <Button className="mb-4 mt-3" onClick={addItem}>
        Add Item
      </Button>
      <div>
        <Button type="primary" size="large" onClick={onSave} loading={isSaving}>
          Publish New Version
        </Button>
      </div>
    </div>
  );
}
