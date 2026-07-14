import { baseApi } from "./baseApi";

export interface NotificationTemplate {
  id: string;
  key: string;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  bodyAr: string;
  bodyEn: string;
  active: boolean;
}

export interface NotificationTemplateInput {
  key: string;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  bodyAr: string;
  bodyEn: string;
  active?: boolean;
}

export interface NotificationLog {
  id: string;
  bookingId: string | null;
  customerId: string | null;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  templateKey: string;
  status: "SENT" | "FAILED" | "PENDING";
  failureReason: string | null;
  createdAt: string;
}

export interface NotificationLogListResponse {
  items: NotificationLog[];
  total: number;
  page: number;
  pageSize: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotificationTemplates: builder.query<NotificationTemplate[], void>({
      query: () => "/notification-templates",
      providesTags: ["NotificationTemplate"],
    }),
    upsertNotificationTemplate: builder.mutation<NotificationTemplate, NotificationTemplateInput>({
      query: (body) => ({ url: "/notification-templates", method: "PUT", body }),
      invalidatesTags: ["NotificationTemplate"],
    }),
    listNotificationLogs: builder.query<NotificationLogListResponse, { status?: string } | void>({
      query: (args) => ({ url: "/notification-logs", params: args ?? undefined }),
      providesTags: ["NotificationLog"],
    }),
    listOwnNotificationLogs: builder.query<NotificationLog[], void>({
      query: () => "/notification-logs/me",
      providesTags: ["NotificationLog"],
    }),
  }),
});

export const {
  useListNotificationTemplatesQuery,
  useUpsertNotificationTemplateMutation,
  useListNotificationLogsQuery,
  useListOwnNotificationLogsQuery,
} = notificationsApi;
