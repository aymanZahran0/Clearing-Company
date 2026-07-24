import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Select, Table, message } from "antd";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  useGetChecklistTemplateQuery,
  useUpsertChecklistTemplateMutation,
  type ChecklistItemType,
  type ChecklistTemplateItem,
} from "../../../api/checklistsApi";
import { enumOptions } from "../../../lib/enumOptions";

const ITEM_TYPES: ChecklistItemType[] = ["YES_NO", "TEXT", "NUMBER", "SIGNATURE", "ISSUE_FLAG"];

type DraftItem = Omit<ChecklistTemplateItem, "id">;

// T127 (US5): checklist-template editor for a service. There is no broader
// catalog admin section (List/ServiceEditor screens) built yet — this page
// stands alone under admin/pages/catalog/ so it's ready to be linked from
// one once that catalog UI ships, rather than blocking the checklist
// feature on unrelated scope.
export default function ChecklistTemplateEditor() {
  const { t } = useTranslation();
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
      message.error(t("admin:checklistTemplate.minItemsError"));
      return;
    }
    try {
      await upsertTemplate({ serviceId, items }).unwrap();
      message.success(t("admin:checklistTemplate.published", { version: (data?.version ?? 0) + 1 }));
    } catch {
      // toast shown by the global RTK Query error middleware
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">{t("admin:checklistTemplate.title")}</h1>
      {!isLoading && data && (
        <p className="mb-4 text-sm text-gray-500">{t("admin:checklistTemplate.currentVersion", { version: data.version })}</p>
      )}
      <Table
        rowKey={(_, index) => String(index)}
        dataSource={items}
        pagination={false}
        scroll={{ x: true }}
        columns={[
          {
            title: t("admin:checklistTemplate.labelAr"),
            render: (_: unknown, row: DraftItem, index: number) => (
              <Input value={row.labelAr} onChange={(e) => updateItem(index, { labelAr: e.target.value })} />
            ),
          },
          {
            title: t("admin:checklistTemplate.labelEn"),
            render: (_: unknown, row: DraftItem, index: number) => (
              <Input value={row.labelEn} onChange={(e) => updateItem(index, { labelEn: e.target.value })} />
            ),
          },
          {
            title: t("admin:checklistTemplate.type"),
            render: (_: unknown, row: DraftItem, index: number) => (
              <Select
                value={row.type}
                options={enumOptions("checklistItemType", ITEM_TYPES)}
                onChange={(type) => updateItem(index, { type })}
                className="w-36"
              />
            ),
          },
          {
            title: t("admin:checklistTemplate.required"),
            render: (_: unknown, row: DraftItem, index: number) => (
              <Checkbox
                checked={row.required}
                onChange={(e) => updateItem(index, { required: e.target.checked })}
              />
            ),
          },
          {
            title: t("admin:common.actions"),
            render: (_: unknown, __: DraftItem, index: number) => (
              <Button danger onClick={() => removeItem(index)}>
                {t("admin:checklistTemplate.remove")}
              </Button>
            ),
          },
        ]}
      />
      <Button className="mb-4 mt-3" onClick={addItem}>
        {t("admin:checklistTemplate.addItem")}
      </Button>
      <div>
        <Button type="primary" size="large" onClick={onSave} loading={isSaving}>
          {t("admin:checklistTemplate.publishNewVersion")}
        </Button>
      </div>
    </div>
  );
}
