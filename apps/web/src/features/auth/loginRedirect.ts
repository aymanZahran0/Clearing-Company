import type { PublicUser } from "./authSlice";

interface LoginLocationState {
  from?: { pathname: string; search?: string; hash?: string };
}

export function getLoginRedirect(
  role: PublicUser["role"] | undefined,
  state: LoginLocationState | null,
  fallbackPath = "/bookings",
) {
  const from = state?.from;
  const pathname = from?.pathname;
  const isAdminPath = pathname === "/admin" || pathname?.startsWith("/admin/");
  const isSafePath = pathname?.startsWith("/") && !pathname.startsWith("//") && !pathname.includes("\\");
  const isLoginPath = pathname === "/login" || pathname === "/admin/login";

  if (isSafePath && !isLoginPath && isAdminPath === (role === "ADMIN")) {
    return `${pathname}${from?.search ?? ""}${from?.hash ?? ""}`;
  }

  return role === "ADMIN" ? "/admin" : fallbackPath;
}
