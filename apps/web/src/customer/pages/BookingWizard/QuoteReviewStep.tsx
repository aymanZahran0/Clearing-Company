import { useEffect } from "react";
import { Alert, Button, Input, Space, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { setDiscountCode, setQuoteId } from "../../../features/bookingWizard/wizardSlice";
import { useEstimateQuoteMutation } from "../../../api/quotesApi";
import { formatCurrency } from "../../../lib/formatters";

export function QuoteReviewStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const wizard = useSelector((state: RootState) => state.bookingWizard);
  const [estimateQuote, { data: quote, isLoading }] = useEstimateQuoteMutation();

  useEffect(() => {
    if (!wizard.serviceId || !wizard.propertyType || !wizard.requestedDate) return;
    estimateQuote({
      serviceId: wizard.serviceId,
      addOnIds: wizard.addOnIds,
      propertyType: wizard.propertyType,
      propertySizeInput: {
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
    <div>
      {isLoading && <Skeleton active />}
      {breakdown?.requiresManualReview && (
        <Alert
          type="info"
          showIcon
          message="This price requires manual review by our team before it's final."
          className="mb-4"
        />
      )}
      {breakdown && !breakdown.requiresManualReview && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(breakdown.subtotal + breakdown.addOnsTotal, i18n.language)}</span>
          </div>
          {breakdown.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(breakdown.discount, i18n.language)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Travel fee</span>
            <span>{formatCurrency(breakdown.travelFee, i18n.language)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(breakdown.tax, i18n.language)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(breakdown.total, i18n.language)}</span>
          </div>
        </div>
      )}
      <Input.Search
        className="mt-4"
        placeholder="Discount code"
        size="large"
        onSearch={(value) => dispatch(setDiscountCode(value || null))}
      />
      <Space className="mt-6 flex justify-between">
        <Button size="large" onClick={onBack}>
          {t("common.cancel")}
        </Button>
        <Button type="primary" size="large" disabled={!quote} onClick={onNext}>
          {t("common.confirm")}
        </Button>
      </Space>
    </div>
  );
}
