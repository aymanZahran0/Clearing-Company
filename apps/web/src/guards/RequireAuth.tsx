import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

interface RequireAuthProps extends PropsWithChildren {
  loginPath?: string;
}

export function RequireAuth({ children, loginPath = "/login" }: RequireAuthProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
