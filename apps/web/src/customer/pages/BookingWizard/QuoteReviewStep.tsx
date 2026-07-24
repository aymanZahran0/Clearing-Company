import { useEffect } from "react";
import { Alert, Button, Input, Space, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setDiscountCode, setQuoteId } from "../../../features/bookingWizard/wizardSlice";
import { useEstimateQuoteMutation } from "../../../api/quotesApi";
import { formatCurrency } from "../../../lib/formatters";
import { WizardStepCard } from "./WizardStepCard";
import { WizardConfirmButton } from "./WizardConfirmButton";

export function QuoteReviewStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const [estimateQuote, { data: quote, isLoading }] = useEstimateQuoteMutation();

  useEffect(() => {
    if (!wizard.serviceId || !wizard.propertyType || !wizard.requestedDate) return;
    // apps/api/src/modules/quotes/service.ts's PROPERTY_SIZE calculation
    // reads only `sizeMultiplier` (Service.basePrice is a per-unit-size
    // rate) — `rooms`/`areaSqm` alone are not enough for the API to price
    // the booking, so they're resolved into a multiplier here before the
    // estimate request. Rooms is the primary unit; area is a fallback
    // (one unit per ~50 sqm) when only area was entered.
    const sizeMultiplier = wizard.rooms
      ? wizard.rooms
      : wizard.areaSqm
        ? Math.max(1, Math.ceil(wizard.areaSqm / 50))
        : undefined;
    estimateQuote({
      serviceId: wizard.serviceId,
      addOnIds: wizard.addOnIds,
      propertyType: wizard.propertyType,
      propertySizeInput: {
        sizeMultiplier,
        rooms: wizard.rooms ?? undefined,
        areaSqm: wizard.areaSqm ?? undefined,
        conditionModifiers: wizard.conditionModifiers,
      },
      addressId: wizard.addressId ?? undefined,
      requestedDate: wizard.requestedDate,
      requestedTimeSlotId: wizard.requestedTimeSlotId ?? undefined,
      discountCode: wizard.discountCode ?? undefined,
    })
      .unwrap()
      .then((result) => dispatch(setQuoteId(result.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.discountCode]);

  const breakdown = quote?.priceBreakdownJson;

  return (
    <WizardStepCard title={t("customer:bookingWizard.steps.quote")}>
      {isLoading && <Skeleton active />}
      {breakdown?.requiresManualReview && (
        <Alert
          type="info"
          showIcon
          message={t("customer:quoteReview.manualReviewRequired")}
          className="mb-4"
        />
      )}
      {breakdown && !breakdown.requiresManualReview && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{t("customer:quoteReview.subtotal")}</span>
            <span>{formatCurrency(breakdown.subtotal + breakdown.addOnsTotal, i18n.language)}</span>
          </div>
          {breakdown.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t("customer:quoteReview.discount")}</span>
              <span>-{formatCurrency(breakdown.discount, i18n.language)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t("customer:quoteReview.travelFee")}</span>
            <span>{formatCurrency(breakdown.travelFee, i18n.language)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("customer:quoteReview.tax")}</span>
            <span>{formatCurrency(breakdown.tax, i18n.language)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>{t("customer:quoteReview.total")}</span>
            <span>{formatCurrency(breakdown.total, i18n.language)}</span>
          </div>
        </div>
      )}
      <Input.Search
        className="wizard-form mt-4"
        placeholder={t("customer:quoteReview.discountCode")}
        size="large"
        onSearch={(value) => dispatch(setDiscountCode(value || null))}
      />
      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.cancel")}
        </Button>
        <WizardConfirmButton disabled={!quote} onClick={onNext}>
          {t("common.confirm")}
        </WizardConfirmButton>
      </Space>
    </WizardStepCard>
  );
}
