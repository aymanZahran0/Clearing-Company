import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (accessToken) {
    // Login.tsx's own onFinish also navigates to `location.state.from` after
    // a successful sign-in, but that navigate() goes through the router's
    // async action pipeline while this guard reacts synchronously to the
    // same `dispatch(setCredentials(...))` — since it's still mounted here
    // on /login when credentials land. Without reading the same `from`
    // here, this guard's own (faster) redirect always wins the race and
    // unconditionally bounces the freshly-logged-in user to
    // `authenticatedPath`, discarding wherever they were trying to go
    // (e.g. back to `/booking/new?serviceId=...` after clicking "Book Now"
    // while logged out). Reading the same state keeps both redirects in
    // agreement, so it no longer matters which one wins.
    const from = (location.state as { from?: { pathname: string; search: string; hash: string } })?.from;
    const redirectTo = from ? `${from.pathname}${from.search}${from.hash}` : authenticatedPath;
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
