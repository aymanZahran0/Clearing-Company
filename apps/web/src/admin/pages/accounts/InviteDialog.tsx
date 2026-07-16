import { useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import { useInviteAdminAccountMutation } from "../../../api/adminAccountsApi";

interface InviteFormValues {
  fullName: string;
  email: string;
}

// T074/FR-032: invite a new Admin — issues a reset-credential token and
// emails a "set your password" link (apps/api/src/modules/admin-accounts).
export function InviteDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [inviteAdmin, { isLoading }] = useInviteAdminAccountMutation();

  async function onFinish(values: InviteFormValues) {
    try {
      await inviteAdmin(values).unwrap();
      setOpen(false);
      message.success(t("admin:accounts.invited"));
    } catch (err) {
      const status = (err as { status?: number })?.status;
      message.error(status === 409 ? t("admin:accounts.emailExists") : t("admin:accounts.inviteError"));
    }
  }

  return (
    <>
      <Button type="primary" size="large" onClick={() => setOpen(true)}>
        {t("admin:accounts.inviteAdmin")}
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={t("admin:accounts.inviteAdmin")}>
        <Form<InviteFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="fullName" label={t("auth.fullName")} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="email" label={t("admin:accounts.email")} rules={[{ required: true, type: "email" }]}>
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t("admin:accounts.sendInvite")}
          </Button>
        </Form>
      </Modal>
    </>
  );
}
