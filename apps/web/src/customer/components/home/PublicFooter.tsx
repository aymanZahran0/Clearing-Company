import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useListServicesQuery } from "../../../api/servicesApi";

const MAX_FOOTER_SERVICES = 5;

// US1 scenario 3 ("complete footer"). Service links reuse the existing
// services API (FR-006) instead of a hardcoded list.
export function PublicFooter() {
  const { t, i18n } = useTranslation();
  const { data: services } = useListServicesQuery();
  const isAr = i18n.language === "ar";
  const footerServices = (services ?? []).filter((s) => s.active).slice(0, MAX_FOOTER_SERVICES);

  return (
    <footer className="border-t border-gray-100 bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{t("app.name")}</p>
          <p className="mt-2 text-sm text-gray-600">{t("content:home.footer.tagline")}</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">{t("content:home.footer.quickLinksTitle")}</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link to="/" className="inline-flex min-h-11 items-center">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/service-areas" className="inline-flex min-h-11 items-center">
                {t("nav.serviceAreas")}
              </Link>
            </li>
            <li>
              <Link to="/faq" className="inline-flex min-h-11 items-center">
                {t("nav.faq")}
              </Link>
            </li>
            <li>
              <Link to="/track" className="inline-flex min-h-11 items-center">
                {t("content:home.contact.trackBookingCta")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">{t("content:home.footer.servicesTitle")}</p>
          <ul className="flex flex-col gap-2 text-sm">
            {footerServices.map((service) => (
              <li key={service.id}>
                <Link to={`/services/${service.slug}`} className="inline-flex min-h-11 items-center">
                  {isAr ? service.nameAr : service.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-gray-600">
        {t("content:home.footer.rightsReserved", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
