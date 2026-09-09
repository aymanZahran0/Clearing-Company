import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { message } from "antd";
import authReducer, { setCredentials } from "../../src/features/auth/authSlice";
import { baseApi } from "../../src/api/baseApi";
import ForgotPassword from "../../src/customer/pages/ForgotPassword";
import ResetPassword from "../../src/customer/pages/ResetPassword";
import { RequireGuest } from "../../src/guards/RequireGuest";
import i18n from "../../src/lib/i18n";

const token = "a".repeat(64);
const fetchMock = vi.fn();
const stores: ReturnType<typeof makeStore>[] = [];
function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

function mount(path: string, authenticated = false) {
  const store = makeStore();
  stores.push(store);
  if (authenticated)
    store.dispatch(
      setCredentials({
        accessToken: "old-access-token",
        user: {
          id: "user",
          fullName: "Customer",
          email: "customer@example.com",
          phone: null,
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      })
    );
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/login"
            element={
              <RequireGuest>
                <div>Sign in page</div>
              </RequireGuest>
            }
          />
          <Route path="/" element={<div>Already signed in</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  fetchMock
    .mockReset()
    .mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: "OK" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
  vi.stubGlobal("fetch", fetchMock);
  // Node's native Request requires a Node AbortSignal rather than jsdom's.
  vi.stubGlobal(
    "AbortController",
    class {
      constructor() {
        return transferableAbortController();
      }
    }
  );
  vi.spyOn(message, "success").mockImplementation(
    () => (() => {}) as ReturnType<typeof message.success>
  );
});

afterEach(() => {
  cleanup();
  for (const store of stores.splice(0)) store.dispatch(baseApi.util.resetApiState());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("password recovery forms", () => {
  it("submits only a normalized email, displays instructions and lets users try another email", async () => {
    mount("/forgot-password");
    const user = userEvent.setup();
    const input = screen.getByLabelText("Email address");
    expect(input).toHaveAttribute("type", "email");
    await user.type(input, "Customer@Example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Check your spam folder");
    const req = fetchMock.mock.calls[0]![0] as Request;
    expect(req.url).toMatch(/\/auth\/forgot-password$/);
    expect(await req.json()).toEqual({ email: "customer@example.com" });
    await user.click(screen.getByRole("button", { name: "Try again or use another email" }));
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("rejects a phone number as recovery input", async () => {
    mount("/forgot-password");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email address"), "0588888888");
    await user.tab();
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["/reset-password", "/reset-password?token=bad"])(
    "offers a new link without a password form at %s",
    (path) => {
      mount(path);
      expect(screen.getByRole("alert")).toHaveTextContent("Request a new link");
      expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
        "href",
        "/forgot-password"
      );
    }
  );

  it("requires matching passwords, resets and clears the signed-in session before redirecting", async () => {
    const store = mount(`/reset-password?token=${token}`, true);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Password"), "new-password");
    await user.type(screen.getByLabelText("Confirm new password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(await screen.findByText("The passwords don't match.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(screen.getByLabelText("Confirm new password"), "new-password");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(store.getState().auth.accessToken).toBeNull();
    expect(await (fetchMock.mock.calls[0]![0] as Request).json()).toEqual({
      token,
      newPassword: "new-password",
    });
    expect(message.success).toHaveBeenCalledWith(
      "Your password has been reset. Sign in with your new password."
    );
  });

  it("replaces the form with a recovery action when the server rejects an expired link", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR" } }), { status: 400 })
    );
    mount(`/reset-password?token=${token}`);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Password"), "new-password");
    await user.type(screen.getByLabelText("Confirm new password"), "new-password");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("expired"));
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("shows email-only instructions in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount("/forgot-password");
    expect(screen.getByLabelText("البريد الإلكتروني")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("button", { name: "إرسال رابط إعادة التعيين" })).toBeInTheDocument();
  });
});
