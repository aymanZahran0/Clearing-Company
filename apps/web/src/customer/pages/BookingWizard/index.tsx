import { useEffect, useState } from "react";
import { Steps } from "antd";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { setServiceId } from "../../../features/bookingWizard/wizardSlice";
import { PropertyStep } from "./PropertyStep";
import { AddressStep } from "./AddressStep";
import { AddOnsStep } from "./AddOnsStep";
import { ScheduleStep } from "./ScheduleStep";
import { QuoteReviewStep } from "./QuoteReviewStep";
import { ConfirmationStep } from "./ConfirmationStep";

const STEP_LABELS = ["Property", "Address", "Add-ons", "Schedule", "Quote", "Confirm"];

// Requires authentication (route-guarded) per research.md R6: the web
// self-service flow requires a Customer account.
export default function BookingWizard() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const serviceId = searchParams.get("serviceId");
    if (serviceId) dispatch(setServiceId(serviceId));
  }, [searchParams, dispatch]);

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <Steps current={step} items={STEP_LABELS.map((label) => ({ title: label }))} className="mb-6" />
      {step === 0 && <PropertyStep onNext={next} />}
      {step === 1 && <AddressStep onNext={next} onBack={back} />}
      {step === 2 && <AddOnsStep onNext={next} onBack={back} />}
      {step === 3 && <ScheduleStep onNext={next} onBack={back} />}
      {step === 4 && <QuoteReviewStep onNext={next} onBack={back} />}
      {step === 5 && <ConfirmationStep onBack={back} />}
    </div>
  );
}
