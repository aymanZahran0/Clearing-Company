import { ConfigProvider } from "antd";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Provider } from "react-redux";
import { store } from "./store";
import { RTL_LOCALES } from "../lib/i18n";
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

  return <ConfigProvider direction={direction}>{children}</ConfigProvider>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <LocaleAwareConfigProvider>{children}</LocaleAwareConfigProvider>
    </Provider>
  );
}
