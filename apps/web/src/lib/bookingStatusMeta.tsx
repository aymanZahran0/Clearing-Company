import {
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { BookingStatus } from "../api/bookingsApi";
import type { Tone } from "./tone";

// Shared by BookingsList and BookingDetail so a status always carries the
// same tone/icon wherever it appears.
export const BOOKING_STATUS_META: Record<BookingStatus, { tone: Tone; icon: React.ReactNode }> = {
  DRAFT: { tone: "neutral", icon: <EditOutlined /> },
  PENDING: { tone: "warning", icon: <ClockCircleOutlined /> },
  CONFIRMED: { tone: "primary", icon: <CheckCircleOutlined /> },
  RESCHEDULED: { tone: "accent", icon: <CalendarOutlined /> },
  IN_PROGRESS: { tone: "accent", icon: <SyncOutlined /> },
  COMPLETED: { tone: "success", icon: <CheckOutlined /> },
  CANCELLED: { tone: "neutral", icon: <StopOutlined /> },
  REJECTED: { tone: "error", icon: <CloseOutlined /> },
  COMPLAINT_OPENED: { tone: "error", icon: <ExclamationCircleOutlined /> },
};
