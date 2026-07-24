import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { RequireAuth } from "./RequireAuth";

interface RequireRoleProps extends PropsWithChildren {
  role: "CUSTOMER" | "ADMIN";
}

/**
 * FR-003 client-side mirror: hides Admin-only routes from Customers (and
 * vice versa). The server enforces this independently in every handler —
 * this guard is UX, not the security boundary.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const fallbackPath = user?.role === "ADMIN" ? "/admin" : "/";

  return (
    <RequireAuth loginPath={role === "ADMIN" ? "/admin/login" : "/login"}>
      {user?.role === role ? <>{children}</> : <Navigate to={fallbackPath} replace />}
    </RequireAuth>
  );
}
