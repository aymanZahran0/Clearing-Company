import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useListServicesQuery } from "../../../api/servicesApi";
import logo from "../../../assets/logo/logo.png";

const MAX_FOOTER_SERVICES = 5;

// US1 scenario 3 ("complete footer"). Service links reuse the existing
// services API (FR-006) instead of a hardcoded list.
export function PublicFooter() {
  const { t } = useTranslation();
  const { data: services } = useListServicesQuery();
  const footerServices = (services ?? []).filter((s) => s.active).slice(0, MAX_FOOTER_SERVICES);

  return (
    <footer className="border-t border-hairline bg-white px-4 pb-7 pt-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <Link to="/" className="inline-flex min-h-11 items-center" aria-label={t("app.name") as string}>
            <span className="relative block h-20 w-44 overflow-hidden">
              <img src={logo} alt={t("app.name") as string} className="absolute start-1/2 top-[calc(50%+13px)] h-44 w-auto max-w-none -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted">{t("content:home.footer.tagline")}</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t("content:home.footer.quickLinksTitle")}</p>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li>
              <Link to="/" className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/service-areas" className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                {t("nav.serviceAreas")}
              </Link>
            </li>
            <li>
              <Link to="/faq" className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                {t("nav.faq")}
              </Link>
            </li>
            <li>
              <Link to="/track" className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                {t("content:home.contact.trackBookingCta")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t("content:home.footer.servicesTitle")}</p>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            {footerServices.map((service) => (
              <li key={service.id}>
                <Link
                  to={`/services/${service.slug}`}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-primary"
                >
                  {service.nameAr}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-9 max-w-6xl border-t border-hairline pt-6 text-center text-xs text-muted">
        <p>{t("content:home.footer.rightsReserved", { year: new Date().getFullYear() })}</p>
        <div className="mx-auto mt-3 h-px w-24 bg-hairline" />
        <p className="mt-3">{t("content:home.footer.poweredBy")}</p>
      </div>
    </footer>
  );
}
