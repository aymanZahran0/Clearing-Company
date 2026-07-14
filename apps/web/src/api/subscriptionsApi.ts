import { baseApi } from "./baseApi";

export type SubscriptionFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export interface Subscription {
  id: string;
  customerId: string;
  addressId: string;
  serviceConfigurationJson: { serviceId: string; addOnIds: string[] };
  frequency: SubscriptionFrequency;
  preferredWeekday: number | null;
  preferredTimeWindow: string | null;
  priceSnapshot: number;
  startsAt: string;
  endsAt: string | null;
  status: SubscriptionStatus;
  lastGeneratedAt: string | null;
  createdAt: string;
}

export interface SubscriptionListResponse {
  items: Subscription[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSubscriptionInput {
  customerId: string;
  addressId: string;
  serviceConfiguration: { serviceId: string; addOnIds?: string[] };
  frequency: SubscriptionFrequency;
  preferredWeekday?: number;
  preferredTimeWindow?: string;
  priceSnapshot: number;
  startsAt: string;
  endsAt?: string;
}

export const subscriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSubscription: builder.mutation<Subscription, CreateSubscriptionInput>({
      query: (body) => ({ url: "/subscriptions", method: "POST", body }),
      invalidatesTags: ["Subscription"],
    }),
    listSubscriptions: builder.query<SubscriptionListResponse, { status?: SubscriptionStatus } | void>({
      query: (args) => ({ url: "/subscriptions", params: args ?? undefined }),
      providesTags: ["Subscription"],
    }),
    listOwnSubscriptions: builder.query<Subscription[], void>({
      query: () => "/subscriptions/me",
      providesTags: ["Subscription"],
    }),
    getSubscription: builder.query<Subscription, string>({
      query: (id) => `/subscriptions/${id}`,
      providesTags: ["Subscription"],
    }),
    updateSubscription: builder.mutation<Subscription, { id: string; body: Partial<CreateSubscriptionInput> }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Subscription"],
    }),
    pauseSubscription: builder.mutation<Subscription, string>({
      query: (id) => ({ url: `/subscriptions/${id}/pause`, method: "POST" }),
      invalidatesTags: ["Subscription"],
    }),
    resumeSubscription: builder.mutation<Subscription, string>({
      query: (id) => ({ url: `/subscriptions/${id}/resume`, method: "POST" }),
      invalidatesTags: ["Subscription"],
    }),
    cancelSubscription: builder.mutation<Subscription, string>({
      query: (id) => ({ url: `/subscriptions/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["Subscription"],
    }),
    listOccurrences: builder.query<
      Array<{ id: string; occurrenceDate: string | null; status: string; referenceNumber: string }>,
      string
    >({
      query: (subscriptionId) => `/subscriptions/${subscriptionId}/occurrences`,
      providesTags: ["Subscription"],
    }),
    skipOccurrence: builder.mutation<void, { subscriptionId: string; occurrenceDate: string }>({
      query: ({ subscriptionId, occurrenceDate }) => ({
        url: `/subscriptions/${subscriptionId}/occurrences/skip`,
        method: "POST",
        body: { occurrenceDate },
      }),
      invalidatesTags: ["Subscription"],
    }),
  }),
});

export const {
  useCreateSubscriptionMutation,
  useListSubscriptionsQuery,
  useListOwnSubscriptionsQuery,
  useGetSubscriptionQuery,
  useUpdateSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCancelSubscriptionMutation,
  useListOccurrencesQuery,
  useSkipOccurrenceMutation,
} = subscriptionsApi;
