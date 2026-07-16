import { useState } from "react";
import { Button, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import { useResetAdminCredentialMutation } from "../../../api/adminAccountsApi";

// T074/FR-035: Admin-mediated reset of *another* Admin's credential —
// distinct from the self-service forgot-password flow.
export function ResetDialog({ accountId, accountName }: { accountId: string; accountName: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [resetCredential, { isLoading }] = useResetAdminCredentialMutation();

  async function onConfirm() {
    try {
      await resetCredential(accountId).unwrap();
      setOpen(false);
      message.success(t("admin:accounts.resetSent"));
    } catch {
      message.error(t("admin:accounts.resetError"));
    }
  }

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        {t("admin:accounts.resetCredential")}
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onConfirm}
        confirmLoading={isLoading}
        title={t("admin:accounts.resetCredential")}
        okText={t("admin:accounts.resetCredential")}
      >
        <p>{t("admin:accounts.resetExplanation", { name: accountName })}</p>
      </Modal>
    </>
  );
}
