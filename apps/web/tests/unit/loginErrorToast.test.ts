import { afterEach, describe, expect, it, vi } from "vitest";

const messageError = vi.fn();

vi.mock("antd", () => ({
  message: { error: messageError },
}));

describe("login error toast", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    messageError.mockClear();
  });

  it("does not turn an unauthenticated login 401 into a token refresh", async () => {
    const { shouldAttemptReauth } = await import("../../src/api/baseApi");

    expect(shouldAttemptReauth(401, null)).toBe(false);
    expect(shouldAttemptReauth(401, "expired-access-token")).toBe(true);
  });

  it("shows the suspended-account message for the rejected login", async () => {
    const { errorToastMiddleware } = await import("../../src/api/errorToastMiddleware");
    const next = vi.fn();
    const dispatch = errorToastMiddleware({} as never)(next);
    const action = {
      type: "api/executeMutation/rejected",
      payload: {
        status: 401,
        data: {
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: "This account has been suspended",
          },
        },
      },
      meta: { requestId: "login-request", requestStatus: "rejected", rejectedWithValue: true },
    };

    dispatch(action);

    expect(messageError).toHaveBeenCalledOnce();
    expect(messageError).toHaveBeenCalledWith("تم إيقاف هذا الحساب");
    expect(next).toHaveBeenCalledWith(action);
  });
});
