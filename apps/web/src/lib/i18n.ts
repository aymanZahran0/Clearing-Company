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
import arEnums from "../locales/ar/enums.json";
import enEnums from "../locales/en/enums.json";

// Arabic is the primary locale (constitution Principle III); English is a
// fully supported secondary locale, not a stub.
export const DEFAULT_LOCALE = "ar";

export function isArabicLocale(language?: string) {
  return language?.toLowerCase().split("-")[0] === "ar";
}

// research.md R11: namespaced by app area so each admin/customer/catalog/
// content feature owns its own translation file instead of one growing
// common.json.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: arCommon, admin: arAdmin, customer: arCustomer, catalog: arCatalog, content: arContent, enums: arEnums },
      en: { common: enCommon, admin: enAdmin, customer: enCustomer, catalog: enCatalog, content: enContent, enums: enEnums },
    },
    supportedLngs: ["ar", "en"],
    fallbackLng: DEFAULT_LOCALE,
    ns: ["common", "admin", "customer", "catalog", "content", "enums"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      // Respect an explicit choice made with the language toggle. On a new
      // device, do not inherit the browser language: Arabic is the product's
      // required first-visit locale regardless of device settings.
      order: ["localStorage"],
      caches: ["localStorage"],
      // Mobile browsers commonly expose Arabic as ar-SA/ar-EG. Normalize it
      // so every content and layout branch sees the supported base locale.
      convertDetectedLanguage: (language) => {
        const normalized = language.toLowerCase();
        return normalized.split("-")[0] ?? normalized;
      },
    },
  });

export default i18n;
