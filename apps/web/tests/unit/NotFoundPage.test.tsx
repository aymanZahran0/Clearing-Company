import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, createMemoryRouter, RouterProvider } from "react-router-dom";
import NotFoundPage from "../../src/pages/NotFoundPage";
import RouteErrorPage from "../../src/pages/RouteErrorPage";
import "../../src/lib/i18n";

describe("NotFoundPage", () => {
  it("renders the Arabic not-found message with Home and Back actions", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("الصفحة غير موجودة")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "العودة للرئيسية" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "الرجوع للخلف" })).toBeInTheDocument();
  });
});

function Thrower(): never {
  throw new Error("boom");
}

describe("RouteErrorPage", () => {
  it("renders a branded Arabic error UI with retry/home actions and no raw error message", () => {
    // errorElement is only honored by the data-router APIs, not the
    // declarative <Routes>/<Route> used elsewhere in this file.
    const router = createMemoryRouter(
      [{ path: "/boom", element: <Thrower />, errorElement: <RouteErrorPage /> }],
      { initialEntries: ["/boom"] }
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByText("حدث خطأ ما")).toBeInTheDocument();
    expect(screen.queryByText(/boom/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "العودة للرئيسية" })).toHaveAttribute("href", "/");
  });
});
