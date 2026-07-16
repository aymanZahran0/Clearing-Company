import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import arCommon from "../locales/ar/common.json";
import enCommon from "../locales/en/common.json";
import arAdmin from "../locales/ar/admin.json";
import enAdmin from "../locales/en/admin.json";
import arCustomer from "../locales/ar/customer.json";
import enCustomer from "../locales/en/customer.json";
import arCatalog from "../locales/ar/catalog.json";
import enCatalog from "../locales/en/catalog.json";
import arContent from "../locales/ar/content.json";
import enContent from "../locales/en/content.json";

// Arabic is the primary locale (constitution Principle III); English is a
// fully supported secondary locale, not a stub.
export const RTL_LOCALES = new Set(["ar"]);

// research.md R11: namespaced by app area so each admin/customer/catalog/
// content feature owns its own translation file instead of one growing
// common.json.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: arCommon, admin: arAdmin, customer: arCustomer, catalog: arCatalog, content: arContent },
      en: { common: enCommon, admin: enAdmin, customer: enCustomer, catalog: enCatalog, content: enContent },
    },
    fallbackLng: "ar",
    lng: import.meta.env.VITE_DEFAULT_LOCALE ?? "ar",
    ns: ["common", "admin", "customer", "catalog", "content"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
