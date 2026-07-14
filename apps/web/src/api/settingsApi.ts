import { baseApi } from "./baseApi";

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSettings: builder.query<SystemSetting[], void>({
      query: () => "/settings",
      providesTags: ["Setting"],
    }),
    updateSetting: builder.mutation<SystemSetting, { key: string; value: unknown; description?: string }>({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      invalidatesTags: ["Setting"],
    }),
  }),
});

export const { useListSettingsQuery, useUpdateSettingMutation } = settingsApi;
