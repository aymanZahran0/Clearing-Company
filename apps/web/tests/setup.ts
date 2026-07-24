import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import i18n from "../src/lib/i18n";

// Arabic is the product's primary locale and the UI assertions use it
// unless a test explicitly switches language. Browser detection otherwise
// makes the suite depend on the developer machine's navigator language.
beforeEach(async () => {
  await i18n.changeLanguage("ar");
});

// jsdom doesn't implement matchMedia; Ant Design's responsive grid hooks
// (useBreakpoint) call it on mount. Standard test-environment polyfill.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
