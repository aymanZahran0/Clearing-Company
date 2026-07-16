import { ConfigProvider } from "antd";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Provider } from "react-redux";
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

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
  }, [direction, i18n.language]);

  return (
    <ConfigProvider
      direction={direction}
      // Ant Design's default primary (#1677ff) fails WCAG 2.1 AA contrast
      // both as white-on-primary button text (~4.1:1) and as
      // primary-on-tint selected-menu-item text (~3.66:1); both need 4.5:1
      // (constitution Principle IV). This darker blue keeps the same hue
      // while clearing 4.5:1 in both directions. colorTextDescription
      // (used by e.g. Statistic titles) has the same problem at its
      // default #8c8c8c (~3.36:1 on white) — darkened for the same reason.
      theme={{
        token: {
          colorPrimary: "#0958d9",
          colorLink: "#0958d9",
          colorLinkHover: "#0958d9",
          colorTextDescription: "#595959",
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
