import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { useRefreshMutation } from "../../api/authApi";
import { setCredentials, setBootstrapped } from "./authSlice";

// Runs once on app load: attempts a silent refresh via the httpOnly cookie
// so a page reload / deep link doesn't bounce an already-logged-in user to
// the login screen (see authSlice.ts's `bootstrapped` doc comment). Route
// guards must not redirect until this resolves.
export function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const bootstrapped = useSelector((state: RootState) => state.auth.bootstrapped);
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    refresh()
      .unwrap()
      .then(({ accessToken, user }) => {
        dispatch(setCredentials({ accessToken, user }));
      })
      .catch(() => {
        // No valid session — expected for a genuinely logged-out visitor.
      })
      .finally(() => {
        dispatch(setBootstrapped());
      });
    // Runs exactly once per app load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
