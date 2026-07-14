import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer from "../../src/features/auth/authSlice";
import { baseApi } from "../../src/api/baseApi";
import { RequireAuth } from "../../src/guards/RequireAuth";
import { RequireRole } from "../../src/guards/RequireRole";
import type { PublicUser } from "../../src/features/auth/authSlice";

function renderWithStore(
  ui: React.ReactElement,
  preloadedAuth: { accessToken: string | null; user: PublicUser | null }
) {
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
    preloadedState: { auth: preloadedAuth },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/protected" element={ui} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("RequireAuth", () => {
  it("redirects to /login when there is no access token", () => {
    renderWithStore(
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>,
      { accessToken: null, user: null }
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    renderWithStore(
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>,
      { accessToken: "token", user: null }
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});

describe("RequireRole", () => {
  const adminUser: PublicUser = {
    id: "1",
    fullName: "Admin",
    email: null,
    phone: null,
    role: "ADMIN",
    status: "ACTIVE",
  };
  const customerUser: PublicUser = {
    id: "2",
    fullName: "Customer",
    email: null,
    phone: null,
    role: "CUSTOMER",
    status: "ACTIVE",
  };

  it("redirects a CUSTOMER away from an ADMIN-only route", () => {
    renderWithStore(
      <RequireRole role="ADMIN">
        <div>Admin Area</div>
      </RequireRole>,
      { accessToken: "token", user: customerUser }
    );
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("renders children for a matching ADMIN role", () => {
    renderWithStore(
      <RequireRole role="ADMIN">
        <div>Admin Area</div>
      </RequireRole>,
      { accessToken: "token", user: adminUser }
    );
    expect(screen.getByText("Admin Area")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated, even for the correct role check", () => {
    renderWithStore(
      <RequireRole role="ADMIN">
        <div>Admin Area</div>
      </RequireRole>,
      { accessToken: null, user: null }
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
