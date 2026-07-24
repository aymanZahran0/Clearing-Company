import { baseApi } from "./baseApi";

export interface Payment {
  id: string;
  bookingId: string;
  method: "CASH" | "BANK_TRANSFER" | "POS" | "COMPLIMENTARY" | "OTHER";
  status: "PAID" | "PARTIALLY_PAID" | "REFUNDED_RECORDED" | "WAIVED";
  amount: number;
  reference: string | null;
  paidAt: string | null;
}

export interface PaymentInput {
  method: Payment["method"];
  status?: Payment["status"];
  amount: number;
  reference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number;
  discount: number;
  travelFee: number;
  tax: number;
  total: number;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query<Payment[], string>({
      query: (bookingId) => `/bookings/${bookingId}/payments`,
      providesTags: (_result, _error, bookingId) => [{ type: "Payment", id: bookingId }],
    }),
    recordPayment: builder.mutation<Payment, { bookingId: string; body: PaymentInput }>({
      query: ({ bookingId, body }) => ({
        url: `/bookings/${bookingId}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { bookingId }) => [{ type: "Payment", id: bookingId }],
    }),
    getInvoice: builder.query<Invoice, string>({
      query: (bookingId) => `/bookings/${bookingId}/invoice`,
    }),
    listOwnInvoices: builder.query<Invoice[], void>({
      query: () => "/invoices/mine",
    }),
  }),
});

export const { useListPaymentsQuery, useRecordPaymentMutation, useGetInvoiceQuery, useListOwnInvoicesQuery } =
  paymentsApi;
