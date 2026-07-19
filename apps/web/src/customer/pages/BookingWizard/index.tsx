import { useEffect, useState } from "react";
import { Steps } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "../../../app/store";
import { setServiceId } from "../../../features/bookingWizard/wizardSlice";
import { useListServicesQuery } from "../../../api/servicesApi";
import { PropertyStep } from "./PropertyStep";
import { AddressStep } from "./AddressStep";
import { AddOnsStep } from "./AddOnsStep";
import { ScheduleStep } from "./ScheduleStep";
import { QuoteReviewStep } from "./QuoteReviewStep";
import { ConfirmationStep } from "./ConfirmationStep";

// US3 scenario 1: translation keys, not literal English titles (FR-011).
const STEP_KEYS = ["property", "address", "addOns", "schedule", "quote", "confirm"] as const;
type StepKey = (typeof STEP_KEYS)[number];

// Requires authentication (route-guarded) per research.md R6: the web
// self-service flow requires a Customer account.
export default function BookingWizard() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const { data: services } = useListServicesQuery();
  const service = services?.find((s) => s.id === wizard.serviceId);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const serviceId = searchParams.get("serviceId");
    if (serviceId) dispatch(setServiceId(serviceId));
  }, [searchParams, dispatch]);

  // A step with nothing to show for the selected service (e.g. no add-ons
  // configured) is skipped from both the indicator and next/back
  // navigation instead of rendering an empty screen. Add more cases here
  // as other steps grow conditional content.
  function isStepAvailable(key: StepKey | undefined): boolean {
    if (key === "addOns") return (service?.addOns.length ?? 0) > 0;
    return true;
  }

  const visibleStepKeys = STEP_KEYS.filter(isStepAvailable);
  const currentKey = STEP_KEYS[step] ?? STEP_KEYS[0];
  const currentVisibleIndex = Math.max(visibleStepKeys.indexOf(currentKey), 0);

  function next() {
    setStep((s) => {
      let n = s + 1;
      while (n < STEP_KEYS.length - 1 && !isStepAvailable(STEP_KEYS[n])) n++;
      return Math.min(n, STEP_KEYS.length - 1);
    });
  }

  function back() {
    setStep((s) => {
      let n = s - 1;
      while (n > 0 && !isStepAvailable(STEP_KEYS[n])) n--;
      return Math.max(n, 0);
    });
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      {/* US3 scenario 3: below `sm`, a vertical compact list reads far
          better than 6 horizontal titles squeezed into 360px — rendered
          via CSS breakpoints (not a resize listener) so it stays correct
          across zoom/rotation without extra JS. */}
      <Steps
        current={currentVisibleIndex}
        direction="vertical"
        size="small"
        items={visibleStepKeys.map((key) => ({ title: t(`customer:bookingWizard.steps.${key}`) }))}
        className="mb-6 sm:hidden"
      />
      <Steps
        current={currentVisibleIndex}
        direction="horizontal"
        size="small"
        items={visibleStepKeys.map((key) => ({ title: t(`customer:bookingWizard.steps.${key}`) }))}
        className="mb-6 hidden sm:flex"
      />
      {currentKey === "property" && <PropertyStep onNext={next} />}
      {currentKey === "address" && <AddressStep onNext={next} onBack={back} />}
      {currentKey === "addOns" && <AddOnsStep onNext={next} onBack={back} />}
      {currentKey === "schedule" && <ScheduleStep onNext={next} onBack={back} />}
      {currentKey === "quote" && <QuoteReviewStep onNext={next} onBack={back} />}
      {currentKey === "confirm" && <ConfirmationStep onBack={back} />}
    </div>
  );
}
