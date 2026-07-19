import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button, Result } from "antd";

// FR-003/US2: final wildcard route, rendered for any path that doesn't
// match a registered route so the user never sees React Router's default
// developer error screen.
export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Result
        status="404"
        title="404"
        subTitle={
          <>
            <p className="text-lg font-semibold">{t("common:errors.notFoundTitle")}</p>
            <p>{t("common:errors.notFoundBody")}</p>
          </>
        }
        extra={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button type="primary" size="large">
                {t("common:errors.goHome")}
              </Button>
            </Link>
            <Button size="large" onClick={() => navigate(-1)}>
              {t("common:errors.goBack")}
            </Button>
          </div>
        }
      />
    </div>
  );
}
