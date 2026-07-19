import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import bookingWizardReducer from "../../src/features/bookingWizard/wizardSlice";
import { baseApi } from "../../src/api/baseApi";
import authReducer from "../../src/features/auth/authSlice";
import BookingWizard from "../../src/customer/pages/BookingWizard";
// Side-effect import: initializes the real i18next instance (Arabic
// default locale) so the wizard's step titles resolve to actual text.
import "../../src/lib/i18n";

function renderWithProviders(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      bookingWizard: bookingWizardReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/booking/new"]}>{ui}</MemoryRouter>
    </Provider>
  );
}

// US3 scenario 1: Arabic step titles, in the exact order the spec requires.
const EXPECTED_TITLES = ["العقار", "العنوان", "الإضافات", "الموعد", "عرض السعر", "التأكيد"];

describe("BookingWizard (Arabic)", () => {
  it("renders all six step titles in Arabic, in order, with no English literals", () => {
    renderWithProviders(<BookingWizard />);

    // Both the mobile (vertical) and desktop (horizontal) Steps instances
    // render simultaneously (CSS-hidden, not conditionally mounted) — each
    // title appears twice.
    for (const title of EXPECTED_TITLES) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Property")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("shows the localized Property Type field, not the raw services-nav label", () => {
    renderWithProviders(<BookingWizard />);
    expect(screen.getByText("نوع العقار")).toBeInTheDocument();
  });
});
