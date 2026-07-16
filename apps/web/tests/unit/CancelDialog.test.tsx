import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../src/api/baseApi";
import authReducer from "../../src/features/auth/authSlice";
import { CancelDialog } from "../../src/admin/pages/bookings/CancelDialog";
// Side-effect import: initializes the real i18next instance (Arabic
// default locale) so CancelDialog's t() calls resolve to actual text
// instead of react-i18next's raw-key fallback when no instance exists.
import "../../src/lib/i18n";

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}

// T118-adjacent component coverage (US4): the no-fee cancellation form
// (FR-040) requires a reason before it can submit, for both the Admin and
// Customer usages of this shared dialog.
describe("CancelDialog", () => {
  it("opens with a required reason field and no submission without it", async () => {
    renderWithStore(<CancelDialog bookingId="booking-1" />);

    fireEvent.click(screen.getByRole("button", { name: "إلغاء الحجز" }));
    await waitFor(() => expect(screen.getByLabelText("سبب الإلغاء")).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: "إلغاء الحجز" })[1]!);

    await waitFor(() =>
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    );
  });

  it("supports a custom trigger label for the customer-facing usage", async () => {
    renderWithStore(<CancelDialog bookingId="booking-1" triggerLabel="Cancel" />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
