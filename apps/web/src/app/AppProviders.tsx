import { ConfigProvider } from "antd";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Provider } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/ar-sa";
import { store } from "./store";
import { RTL_LOCALES } from "../lib/i18n";
import { AuthBootstrap } from "../features/auth/AuthBootstrap";
import "../lib/i18n";

/**
 * Wires Ant Design's `direction` and the document's `dir`/`lang` attributes
 * to the active i18n locale, so RTL/LTR mirrors automatically when the
 * user switches language (constitution Principle III) instead of being
 * patched per-page.
 */
function LocaleAwareConfigProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  const direction = RTL_LOCALES.has(i18n.language) ? "rtl" : "ltr";
  const isArabic = RTL_LOCALES.has(i18n.language);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
    // Locale-sensitive dayjs .format() calls (e.g. weekday/month names in
    // the Admin schedule views) otherwise always render in English.
    dayjs.locale(RTL_LOCALES.has(i18n.language) ? "ar-sa" : "en");
  }, [direction, i18n.language]);

  return (
    <ConfigProvider
      direction={direction}
      // Brand primary per DESIGN.md: deep Nuqaa navy (#00375B), paired
      // with restrained teal (#006477) for links and supporting actions.
      // White-on-primary comfortably clears WCAG AA contrast
      // (constitution Principle IV needs 4.5:1). colorTextDescription
      // (used by e.g. Statistic titles) is the DESIGN.md `muted` token —
      // oklch(0.52 0.02 358), 5.6:1 on white — darkened from Ant Design's
      // default #8c8c8c (~3.36:1) for the same AA reason.
      theme={{
        token: {
          colorPrimary: "#00375B",
          colorLink: "#006477",
          colorLinkHover: "#00536C",
          colorTextDescription: "#555F69",
          colorText: "#151B21",
          colorBorder: "#D2D8DF",
          borderRadius: 12,
          fontFamily: "Tajawal, ui-sans-serif, system-ui, sans-serif",
          // Ant Design derives controlHeightLG from controlHeight × 1.25
          // (32 × 1.25 = 40px by default), so every size="large" control —
          // the app's stated touch-target size (DESIGN.md's 44px Rule) —
          // was actually rendering 4px short. Set explicitly rather than
          // relying on the derived default.
          controlHeightLG: 44,
        },
      }}
      form={{
        // Ant Design's built-in default ("Please enter ${label}") never
        // localizes because no antd `locale` is wired to ConfigProvider;
        // this keeps every Form's required-field message consistent with
        // the app's own convention (e.g. "اسم الشركة مطلوب").
        validateMessages: {
          required: isArabic ? "${label} مطلوب" : "${label} is required",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <LocaleAwareConfigProvider>
        <AuthBootstrap>{children}</AuthBootstrap>
      </LocaleAwareConfigProvider>
    </Provider>
  );
}
