import { Button } from "antd";
import type { ComponentProps } from "react";

function Sparkle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="wizard-sparkle">
      <path
        d="M12 2c0 0 .8 5.2 3 7.4 2.2 2.2 7 2.6 7 2.6s-4.8.4-7 2.6c-2.2 2.2-3 7.4-3 7.4s-.8-5.2-3-7.4c-2.2-2.2-7-2.6-7-2.6s4.8-.4 7-2.6c2.2-2.2 3-7.4 3-7.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

// The wizard's primary CTA everywhere it appears: pill-radius, taller than
// a default large button, with a decorative sparkle pinned to the trailing
// edge — matches the reference design's "confirm and save" button.
export function WizardConfirmButton(props: ComponentProps<typeof Button>) {
  const { className, children, ...rest } = props;
  return (
    <Button type="primary" size="large" className={`wizard-confirm-button ${className ?? ""}`} {...rest}>
      {children}
      <Sparkle />
    </Button>
  );
}
