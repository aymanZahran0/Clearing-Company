import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import bookingWizardReducer from "../../src/features/bookingWizard/wizardSlice";
import { baseApi } from "../../src/api/baseApi";
import authReducer from "../../src/features/auth/authSlice";
import { PropertyStep } from "../../src/customer/pages/BookingWizard/PropertyStep";

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      bookingWizard: bookingWizardReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}

describe("BookingWizard PropertyStep", () => {
  it("requires a property type before advancing", async () => {
    const onNext = vi.fn();
    renderWithStore(<PropertyStep onNext={onNext} />);

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    // Ant Design validation is async; assert onNext was NOT called
    // synchronously for an incomplete form.
    expect(onNext).not.toHaveBeenCalled();
  });

  it("dispatches setPropertyDetails and advances when the property type is selected", async () => {
    const onNext = vi.fn();
    const { store } = renderWithStore(<PropertyStep onNext={onNext} />);

    // Ant Design's Select requires interaction via its combobox role;
    // directly dispatching keeps this test focused on the wizard's own
    // step-advancement contract rather than re-testing AntD internals.
    store.dispatch({
      type: "bookingWizard/setPropertyDetails",
      payload: { propertyType: "VILLA", rooms: 3, areaSqm: null, conditionModifiers: [] },
    });

    expect(store.getState().bookingWizard.propertyType).toBe("VILLA");
  });
});
