import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import type { ComponentProps } from "react";

// The wizard's primary CTA everywhere it appears: pill-radius, taller than
// a default large button, with a conventional checkmark that clearly
// communicates confirmation.
export function WizardConfirmButton(props: ComponentProps<typeof Button>) {
  const { className, children, ...rest } = props;
  return (
    <Button type="primary" size="large" className={`wizard-confirm-button ${className ?? ""}`} {...rest}>
      {children}
      <CheckOutlined aria-hidden="true" />
    </Button>
  );
}
