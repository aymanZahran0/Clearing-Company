import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

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

  if (accessToken) {
    return <Navigate to={authenticatedPath} replace />;
  }

  return <>{children}</>;
}
