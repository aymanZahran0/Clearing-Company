import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "antd";

// Public, prerender-eligible route (research.md R9). Full marketing
// content (trust-focused value proposition, service highlights) is filled
// in as part of Phase 3 (T069); this establishes the real route + shell.
export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t("app.name")}</h1>
      <div className="mt-4">
        <Link to="/services">
          <Button type="primary" size="large">
            {t("nav.services")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
