import type { ReactNode } from "react";

// Shared white card chrome wrapping every wizard step's content, so the
// stepper sits above one consistent panel regardless of what a given step
// renders inside it (form fields, a slot picker, a price breakdown, ...).
export function WizardStepCard({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="wizard-card">
      {title && <h2 className="wizard-card-title">{title}</h2>}
      {children}
    </div>
  );
}
