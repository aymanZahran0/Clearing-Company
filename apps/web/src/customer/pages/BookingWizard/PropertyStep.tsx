import { Form, InputNumber, Select, Checkbox } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setPropertyDetails } from "../../../features/bookingWizard/wizardSlice";
import { enumOptions } from "../../../lib/enumOptions";
import { WizardStepCard } from "./WizardStepCard";
import { WizardConfirmButton } from "./WizardConfirmButton";

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "OFFICE", "SHOP", "CLINIC", "FURNISHED_UNIT", "OTHER"];
const CONDITION_MODIFIERS = ["post_construction", "move_in_out", "heavy_soil", "pets", "stairs"] as const;
const CONDITION_ICONS: Record<(typeof CONDITION_MODIFIERS)[number], string> = {
  post_construction: "🧹",
  move_in_out: "📦",
  heavy_soil: "🧽",
  pets: "🐾",
  stairs: "🪜",
};

interface PropertyStepValues {
  propertyType: string;
  rooms?: number;
  areaSqm?: number;
  conditionModifiers: string[];
}

export function PropertyStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);

  function onFinish(values: PropertyStepValues) {
    dispatch(
      setPropertyDetails({
        propertyType: values.propertyType,
        rooms: values.rooms ?? null,
        areaSqm: values.areaSqm ?? null,
        conditionModifiers: values.conditionModifiers ?? [],
      })
    );
    onNext();
  }

  return (
    <WizardStepCard title={t("customer:propertyStep.title")}>
      <Form<PropertyStepValues>
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="wizard-form"
        initialValues={{
          propertyType: wizard.propertyType ?? undefined,
          rooms: wizard.rooms ?? undefined,
          areaSqm: wizard.areaSqm ?? undefined,
          conditionModifiers: wizard.conditionModifiers,
        }}
      >
        <Form.Item name="propertyType" label={t("customer:propertyStep.propertyType")} rules={[{ required: true }]}>
          <Select size="large" options={enumOptions("propertyType", PROPERTY_TYPES)} />
        </Form.Item>
        <Form.Item name="rooms" label={t("customer:propertyStep.rooms")}>
          <InputNumber
            size="large"
            min={0}
            className="w-full"
            placeholder={t("customer:propertyStep.roomsPlaceholder") as string}
          />
        </Form.Item>
        <Form.Item name="areaSqm" label={t("customer:propertyStep.areaSqm")}>
          <InputNumber
            size="large"
            min={0}
            className="w-full"
            placeholder={t("customer:propertyStep.areaSqmPlaceholder") as string}
          />
        </Form.Item>
        <Form.Item name="conditionModifiers" label={t("customer:propertyStep.conditionModifiers")}>
          <Checkbox.Group className="wizard-chip-group">
            {CONDITION_MODIFIERS.map((v) => (
              <Checkbox key={v} value={v} className="wizard-chip">
                <span className="wizard-chip-icon" aria-hidden="true">
                  {CONDITION_ICONS[v]}
                </span>
                {t(`customer:propertyStep.conditions.${v}`)}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
        <WizardConfirmButton htmlType="submit" block>
          {t("common.confirm")}
        </WizardConfirmButton>
      </Form>
    </WizardStepCard>
  );
}
