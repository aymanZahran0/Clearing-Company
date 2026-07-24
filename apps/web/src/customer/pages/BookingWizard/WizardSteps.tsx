interface WizardStepsProps {
  steps: Array<{ key: string; label: string }>;
  current: number;
  className?: string;
}

// Custom horizontal stepper (numbered circles + connecting track) used in
// place of antd's default <Steps> for >= sm. The connector leaving a step
// lights up as soon as that step is reached/current (not only once the
// *next* step starts) so there's always a visible sliver of progress even
// on step 1 of N — mirrors the reference design's "N of total" progress
// read rather than a strict completed-segments-only fill.
export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  return (
    <nav aria-label="progress" className={className}>
      <ol className="wizard-steps-list">
        {steps.map((step, index) => {
          const circleState = index < current ? "done" : index === current ? "current" : "upcoming";
          const connectorFilled = index - 1 <= current;
          return (
            <li
              key={step.key}
              className={`wizard-step is-${circleState}${connectorFilled ? " is-connector-filled" : ""}`}
            >
              <span className="wizard-step-circle">{index + 1}</span>
              <span className="wizard-step-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
