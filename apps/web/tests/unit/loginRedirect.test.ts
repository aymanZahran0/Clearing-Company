import { describe, expect, it } from "vitest";
import { getLoginRedirect } from "../../src/features/auth/loginRedirect";

describe("shared login redirects", () => {
  it("sends each role to its default destination", () => {
    expect(getLoginRedirect("ADMIN", null)).toBe("/admin");
    expect(getLoginRedirect("CUSTOMER", null)).toBe("/bookings");
  });

  it("preserves customer booking details and admin deep links", () => {
    expect(getLoginRedirect("CUSTOMER", {
      from: { pathname: "/booking/new", search: "?serviceId=123", hash: "#details" },
    })).toBe("/booking/new?serviceId=123#details");
    expect(getLoginRedirect("ADMIN", {
      from: { pathname: "/admin/bookings", search: "?page=2" },
    })).toBe("/admin/bookings?page=2");
  });

  it("uses the signed-in role when the requested page belongs to the other role", () => {
    expect(getLoginRedirect("CUSTOMER", { from: { pathname: "/admin/bookings" } })).toBe("/bookings");
    expect(getLoginRedirect("ADMIN", { from: { pathname: "/booking/new" } })).toBe("/admin");
  });

  it.each(["/login", "/admin/login", "//example.com", "https://example.com", "/\\example.com"])(
    "does not redirect back to a login page or external destination: %s",
    (pathname) => {
      expect(getLoginRedirect("CUSTOMER", { from: { pathname } })).toBe("/bookings");
      expect(getLoginRedirect("ADMIN", { from: { pathname } })).toBe("/admin");
    },
  );
});
