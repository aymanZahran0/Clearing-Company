import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { message } from "antd";
import i18n from "../lib/i18n";
import { translateApiError } from "../lib/apiErrorMessages";

/**
 * Shows exactly one toast, in the current UI language, for every RTK Query
 * request that fails anywhere in the app — including pages that never check
 * `isError` on their query/mutation hooks. Individual components should not
 * show their own generic error toasts on top of this.
 */
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    message.error(translateApiError(action.payload as FetchBaseQueryError, i18n.language));
  }
  return next(action);
};
