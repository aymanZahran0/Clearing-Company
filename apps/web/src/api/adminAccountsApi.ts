import { baseApi } from "./baseApi";

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string | null;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastLoginAt: string | null;
  createdAt: string;
}

export const adminAccountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAdminAccounts: builder.query<AdminAccount[], void>({
      query: () => "/admin/accounts",
      providesTags: ["User"],
    }),
    inviteAdminAccount: builder.mutation<AdminAccount, { fullName: string; email: string }>({
      query: (body) => ({ url: "/admin/accounts/invite", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    createAdminAccount: builder.mutation<
      AdminAccount,
      { fullName: string; email: string; password: string }
    >({
      query: (body) => ({ url: "/admin/accounts", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    suspendAdminAccount: builder.mutation<AdminAccount, string>({
      query: (id) => ({ url: `/admin/accounts/${id}/suspend`, method: "POST" }),
      invalidatesTags: ["User"],
    }),
    reactivateAdminAccount: builder.mutation<AdminAccount, string>({
      query: (id) => ({ url: `/admin/accounts/${id}/reactivate`, method: "POST" }),
      invalidatesTags: ["User"],
    }),
    resetAdminCredential: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/admin/accounts/${id}/reset-credential`, method: "POST" }),
    }),
  }),
});

export const {
  useListAdminAccountsQuery,
  useInviteAdminAccountMutation,
  useCreateAdminAccountMutation,
  useSuspendAdminAccountMutation,
  useReactivateAdminAccountMutation,
  useResetAdminCredentialMutation,
} = adminAccountsApi;
