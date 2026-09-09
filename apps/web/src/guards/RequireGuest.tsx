import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { getLoginRedirect } from "../features/auth/loginRedirect";

interface RequireGuestProps extends PropsWithChildren {
  authenticatedPath?: string;
}

/**
 * Keeps authenticated users out of sign-in screens.
 *
 * AuthBootstrap resolves the refresh-cookie session before the router is
 * rendered, so a direct visit or hard refresh cannot briefly show the login
 * form before this redirect runs.
 */
export function RequireGuest({ children, authenticatedPath = "/" }: RequireGuestProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();

  if (accessToken) {
    // Use the same role-aware destination as the login submit handler.
    const redirectTo = getLoginRedirect(user?.role, location.state, authenticatedPath);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
