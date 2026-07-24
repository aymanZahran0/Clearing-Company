import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { QualityIssueStatus } from "../api/qualityIssuesApi";
import type { Tone } from "./tone";

export const QUALITY_ISSUE_STATUS_META: Record<
  QualityIssueStatus,
  { tone: Tone; icon: React.ReactNode }
> = {
  OPEN: { tone: "error", icon: <ExclamationCircleOutlined /> },
  IN_REVIEW: { tone: "warning", icon: <ClockCircleOutlined /> },
  RESOLVED: { tone: "success", icon: <CheckCircleOutlined /> },
  CLOSED: { tone: "success", icon: <CheckCircleOutlined /> },
};
