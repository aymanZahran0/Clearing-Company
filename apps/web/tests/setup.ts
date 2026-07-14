import "@testing-library/jest-dom/vitest";

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
