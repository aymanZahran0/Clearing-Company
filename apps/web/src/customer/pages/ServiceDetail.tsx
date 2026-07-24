import { CheckOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Button, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useGetServiceBySlugQuery } from "../../api/servicesApi";
import { enumLabel } from "../../lib/enumLabels";
import { formatCurrency } from "../../lib/formatters";
import defaultServiceImage from "../../assets/logo/logo-without-name.png";


// Public, prerender-eligible route (research.md R9).
export default function ServiceDetail() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading } = useGetServiceBySlugQuery(slug ?? "", { skip: !slug });
  const isAr = i18n.language === "ar";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <Skeleton active />
      </div>
    );
  }

  if (!service) {
    return <div className="mx-auto max-w-5xl p-4 sm:p-6">{t("common.error")}</div>;
  }

  const serviceName = service.nameAr;
  const serviceDescription = service.descriptionAr;
  const serviceImage = service.images[0];
  const imageUrl = serviceImage?.url || defaultServiceImage;
  const imageAlt = serviceImage
    ? isAr
      ? serviceImage.altTextAr || serviceName
      : serviceImage.altTextEn || serviceImage.altTextAr || serviceName
    : serviceName;
  const listedPrice = service.basePrice ?? service.minimumPrice;
  const hasPrice = listedPrice != null;

  return (
    <main className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl bg-primary">
          <img
            src={imageUrl}
            alt={imageAlt}
            className={`h-56 w-full sm:h-72 lg:h-80 ${serviceImage ? "object-cover" : "bg-white object-contain p-10"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
          <Tag
            bordered={false}
            className="absolute bottom-4 end-4 m-0 rounded-full bg-primary/85 px-4 py-1.5 font-bold text-white"
          >
            {enumLabel("pricingType", service.pricingType)}
          </Tag>
        </div>

        <section className="py-7 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="m-0 text-3xl font-black text-ink sm:text-4xl">{serviceName}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <ClockCircleOutlined aria-hidden="true" />
                  {t("customer:serviceDetail.duration", {
                    minutes: service.defaultDurationMinutes,
                  })}
                </span>
                <span>{enumLabel("pricingType", service.pricingType)}</span>
              </div>
            </div>

            <div className="shrink-0 sm:text-end">
              <p className="m-0 text-sm text-muted">
                {hasPrice
                  ? t("customer:serviceDetail.startingFrom")
                  : t("customer:serviceDetail.price")}
              </p>
              {hasPrice ? (
                <p className="mb-0 mt-1 text-3xl font-black text-primary">
                  {formatCurrency(listedPrice!, i18n.language)}
                </p>
              ) : (
                <p className="mb-0 mt-1 text-lg font-extrabold text-primary">
                  {t("customer:serviceDetail.customQuote")}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-white p-6">
          <h2 className="m-0 text-lg font-extrabold">{t("customer:serviceDetail.about")}</h2>
          <p className="mb-0 mt-3 max-w-4xl text-base leading-8 text-muted">
            {serviceDescription || t("customer:serviceDetail.descriptionFallback")}
          </p>
        </section>

        {service.addOns.length > 0 && (
          <section className="mt-5 rounded-xl border border-hairline bg-white p-6">
            <h2 className="m-0 text-lg font-extrabold">
              {t("customer:serviceDetail.availableAddOns")}
            </h2>
            <ul className="mb-0 mt-4 space-y-4 p-0">
              {service.addOns.map((addOn) => (
                <li key={addOn.id} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-tint text-accent">
                      <CheckOutlined aria-hidden="true" />
                    </span>
                    <span className="font-semibold">{isAr ? addOn.nameAr : addOn.nameEn}</span>
                  </span>
                  <span className="shrink-0 font-bold text-primary">
                    {formatCurrency(addOn.unitPrice, i18n.language)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5 flex flex-col gap-5 rounded-xl bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="m-0 text-sm text-muted">
              {hasPrice
                ? t("customer:serviceDetail.startingFrom")
                : t("customer:serviceDetail.price")}
            </p>
            <p className="mb-0 mt-1 text-xl font-black text-ink">
              {hasPrice
                ? formatCurrency(listedPrice!, i18n.language)
                : t("customer:serviceDetail.customQuote")}
            </p>
          </div>
          <Link to={`/booking/new?serviceId=${service.id}`} className="sm:min-w-44">
            <Button type="primary" size="large" block className="min-h-11 font-bold">
              {t("customer:serviceDetail.bookNow")}
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
