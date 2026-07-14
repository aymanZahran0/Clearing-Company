import { Button, Form, InputNumber, Select, Checkbox } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setPropertyDetails } from "../../../features/bookingWizard/wizardSlice";

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "OFFICE", "SHOP", "CLINIC", "FURNISHED_UNIT", "OTHER"];
const CONDITION_MODIFIERS = ["post_construction", "move_in_out", "heavy_soil", "pets", "stairs"];

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
    <Form<PropertyStepValues>
      layout="vertical"
      onFinish={onFinish}
      requiredMark={false}
      initialValues={{
        propertyType: wizard.propertyType ?? undefined,
        rooms: wizard.rooms ?? undefined,
        areaSqm: wizard.areaSqm ?? undefined,
        conditionModifiers: wizard.conditionModifiers,
      }}
    >
      <Form.Item name="propertyType" label={t("nav.services")} rules={[{ required: true }]}>
        <Select size="large" options={PROPERTY_TYPES.map((v) => ({ value: v, label: v }))} />
      </Form.Item>
      <Form.Item name="rooms" label="Rooms">
        <InputNumber size="large" min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="areaSqm" label="Area (sqm)">
        <InputNumber size="large" min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="conditionModifiers">
        <Checkbox.Group options={CONDITION_MODIFIERS.map((v) => ({ value: v, label: v }))} />
      </Form.Item>
      <Button type="primary" htmlType="submit" size="large" block>
        {t("common.confirm")}
      </Button>
    </Form>
  );
}

