// Matches contracts/openapi.yaml `ErrorResponse` schema exactly.
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BOOKING_SLOT_UNAVAILABLE"
  | "SERVICE_AREA_UNAVAILABLE"
  | "BOOKING_TRANSITION_INVALID"
  | "ACCOUNT_SUSPENDED"
  | "CUSTOMER_ALREADY_SUSPENDED"
  | "CUSTOMER_NOT_SUSPENDED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}
