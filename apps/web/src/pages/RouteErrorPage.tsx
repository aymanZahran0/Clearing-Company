import { useTranslation } from "react-i18next";
import { Link, useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Button, Result } from "antd";

// FR-004/FR-005/US2: root-level route errorElement. Route loader/render
// errors land here instead of React Router's default developer overlay.
// Stack traces and internal error details are never rendered — only the
// safe recovery actions (retry/home) FR-005 requires.
export default function RouteErrorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error("[RouteErrorPage]", error);
  }

  const status = isRouteErrorResponse(error) ? error.status : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Result
        status="error"
        title={t("common:errors.routeErrorTitle")}
        subTitle={status ? `${status} — ${t("common:errors.routeErrorBody")}` : t("common:errors.routeErrorBody")}
        extra={
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="primary" size="large" onClick={() => navigate(0)}>
              {t("common:errors.retry")}
            </Button>
            <Link to="/">
              <Button size="large">{t("common:errors.goHome")}</Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
