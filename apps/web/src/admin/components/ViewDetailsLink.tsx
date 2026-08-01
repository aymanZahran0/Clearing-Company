import { EyeOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type ViewDetailsLinkProps = {
  to: string;
};

export function ViewDetailsLink({ to }: ViewDetailsLinkProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const label = t("admin:customers.viewDetails");

  return (
    <Tooltip title={label}>
      <Button
        size="small"
        icon={<EyeOutlined aria-hidden="true" />}
        aria-label={label}
        onClick={() => navigate(to)}
        className="inline-flex items-center justify-center border-accent text-accent hover:border-primary hover:text-primary"
      />
    </Tooltip>
  );
}
