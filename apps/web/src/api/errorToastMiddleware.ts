import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { message } from "antd";
import i18n from "../lib/i18n";
import { translateApiError } from "../lib/apiErrorMessages";
import { authApi } from "./authApi";

/**
 * Shows exactly one toast, in the current UI language, for every RTK Query
 * request that fails anywhere in the app — including pages that never check
 * `isError` on their query/mutation hooks. Individual components should not
 * show their own generic error toasts on top of this.
 */
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const error = action.payload as FetchBaseQueryError;
    const code = (error.data as { error?: { code?: string } } | undefined)?.error?.code;
    // No session is expected when a guest first opens the website.
    if (authApi.endpoints.refresh.matchRejected(action) && error.status === 401 && code === "UNAUTHORIZED") {
      return next(action);
    }
    message.error(translateApiError(action.payload as FetchBaseQueryError, i18n.language));
  }
  return next(action);
};
