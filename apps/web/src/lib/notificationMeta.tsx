import { MailOutlined, MessageOutlined, WhatsAppOutlined } from "@ant-design/icons";
import type { Tone } from "./tone";

type NotificationStatus = "SENT" | "FAILED" | "PENDING";
type NotificationChannel = "WHATSAPP" | "SMS" | "EMAIL";

export const NOTIFICATION_STATUS_TONE: Record<NotificationStatus, Tone> = {
  SENT: "success",
  FAILED: "error",
  PENDING: "warning",
};

export const NOTIFICATION_CHANNEL_ICON: Record<NotificationChannel, React.ReactNode> = {
  WHATSAPP: <WhatsAppOutlined />,
  SMS: <MessageOutlined />,
  EMAIL: <MailOutlined />,
};
