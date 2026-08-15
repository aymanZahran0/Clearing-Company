import { baseApi } from "./baseApi";
import type { PublicUser } from "../features/auth/authSlice";

interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  marketingConsent?: boolean;
}

interface LoginRequest {
  identifier: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    // Silent session bootstrap on app load — uses the httpOnly refresh
    // cookie, not a stored access token. Expected to fail (401) for a
    // genuinely logged-out visitor; callers must not surface that as an error.
    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    forgotPassword: builder.mutation<{ message: string }, { identifier: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<
      { message: string },
      { token: string; newPassword: string }
    >({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    // Changes the password for the currently authenticated user. Succeeding
    // revokes every session (including this one, mirroring resetPassword),
    // so the caller must sign the user out client-side afterwards.
    changePassword: builder.mutation<
      { message: string },
      { oldPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
    me: builder.query<PublicUser, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useMeQuery,
} = authApi;
