import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import arCommon from "../locales/ar/common.json";
import enCommon from "../locales/en/common.json";

// Arabic is the primary locale (constitution Principle III); English is a
// fully supported secondary locale, not a stub.
export const RTL_LOCALES = new Set(["ar"]);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: arCommon },
      en: { common: enCommon },
    },
    fallbackLng: "ar",
    lng: import.meta.env.VITE_DEFAULT_LOCALE ?? "ar",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
