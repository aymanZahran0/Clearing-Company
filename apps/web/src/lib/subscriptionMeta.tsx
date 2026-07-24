import { CalendarOutlined, ScheduleOutlined, SyncOutlined } from "@ant-design/icons";
import type { SubscriptionFrequency, SubscriptionStatus } from "../api/subscriptionsApi";
import type { Tone } from "./tone";

// Icon reflects cadence; tone reflects status — mirrors bookingStatusMeta's
// split so recurring/one-off cadence and active/paused/cancelled state read
// independently at a glance.
export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, Tone> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "neutral",
};

export const SUBSCRIPTION_FREQUENCY_ICON: Record<SubscriptionFrequency, React.ReactNode> = {
  WEEKLY: <SyncOutlined />,
  BIWEEKLY: <SyncOutlined />,
  MONTHLY: <ScheduleOutlined />,
  CUSTOM: <CalendarOutlined />,
};
