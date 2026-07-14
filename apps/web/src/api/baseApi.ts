import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { setAccessToken, clearAuth } from "../features/auth/authSlice";
import type { RootState } from "../app/store";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1",
  credentials: "include", // sends the httpOnly refresh-token cookie
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
  },
});

/**
 * Wraps the base query so a 401 triggers a single silent refresh attempt
 * (calling /auth/refresh via the refresh-token cookie) before retrying the
 * original request once. If refresh also fails, the user is logged out
 * client-side.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { accessToken } = refreshResult.data as { accessToken: string };
      api.dispatch(setAccessToken(accessToken));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearAuth());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Customer",
    "Address",
    "Service",
    "Booking",
    "Quote",
    "Subscription",
    "QualityIssue",
    "Review",
    "Report",
    "OperatingHours",
    "ClosedDate",
    "TimeSlot",
    "ChecklistTemplate",
    "ChecklistRun",
    "Commercial",
    "DiscountCode",
    "PricingRule",
    "ContentBlock",
    "Faq",
    "Setting",
    "NotificationTemplate",
    "NotificationLog",
  ],
  endpoints: () => ({}),
});
