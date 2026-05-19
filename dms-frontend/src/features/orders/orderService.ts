import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import {
  buildQueryString,
  normalizePaginatedResponse,
  type PaginatedResponse,
  type PaginationQuery,
} from "@/features/paginationTypes";
import type {
  CreateOrderRequest,
  Order,
  RequestReturnOrderRequest,
  UpdateOrderRequest,
} from "./orderTypes";

export const orderService = createApi({
  reducerPath: "orderService",
  baseQuery,
  tagTypes: ["Orders"],

  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => "/orders",
      providesTags: ["Orders"],
    }),

    getOrdersPage: builder.query<PaginatedResponse<Order>, PaginationQuery>({
      query: (query) => `/orders${buildQueryString(query)}`,
      transformResponse: (response: unknown, _meta, query) =>
        normalizePaginatedResponse<Order>(response, query?.limit),
      providesTags: ["Orders"],
    }),

    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: ["Orders"],
    }),
    getMyOrders: builder.query<Order[], void>({
      query: () => "/orders/my-orders",
      providesTags: ["Orders"],
    }),
    getMyOrdersPage: builder.query<PaginatedResponse<Order>, PaginationQuery>({
      query: (query) => `/orders/my-orders${buildQueryString(query)}`,
      transformResponse: (response: unknown, _meta, query) =>
        normalizePaginatedResponse<Order>(response, query?.limit),
      providesTags: ["Orders"],
    }),
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),
    updateOrder: builder.mutation<
      Order,
      {
        id: string;
        body: UpdateOrderRequest;
      }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),
    approveOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),

    deliverOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/deliver`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),

    returnOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/return`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),

    requestReturnOrder: builder.mutation<
      Order,
      {
        id: string;
        body: RequestReturnOrderRequest;
      }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/return-request`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),

    cancelOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrdersPageQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useApproveOrderMutation,
  useDeliverOrderMutation,
  useReturnOrderMutation,
  useRequestReturnOrderMutation,
  useCancelOrderMutation,
  useUpdateOrderMutation,
  useGetMyOrdersQuery,
  useGetMyOrdersPageQuery,
} = orderService;
