import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import {
  buildQueryString,
  normalizePaginatedResponse,
  type PaginatedResponse,
  type PaginationQuery,
} from "@/features/paginationTypes";
import type {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from "./customerTypes";

export const customerService = createApi({
  reducerPath: "customerService",
  baseQuery,
  tagTypes: ["Customers"],

  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], void>({
      query: () => "/customers",
      providesTags: ["Customers"],
    }),

    getCustomersPage: builder.query<
      PaginatedResponse<Customer>,
      PaginationQuery
    >({
      query: (query) => `/customers${buildQueryString(query)}`,
      transformResponse: (response: unknown, _meta, query) =>
        normalizePaginatedResponse<Customer>(response, query?.limit),
      providesTags: ["Customers"],
    }),

    getMyCustomers: builder.query<Customer[], void>({
      query: () => "/customers/my-customers",
      providesTags: ["Customers"],
    }),

    getMyCustomersPage: builder.query<
      PaginatedResponse<Customer>,
      PaginationQuery
    >({
      query: (query) => `/customers/my-customers${buildQueryString(query)}`,
      transformResponse: (response: unknown, _meta, query) =>
        normalizePaginatedResponse<Customer>(response, query?.limit),
      providesTags: ["Customers"],
    }),

    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: ["Customers"],
    }),

    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),

    updateCustomer: builder.mutation<
      Customer,
      { id: string; body: UpdateCustomerRequest }
    >({
      query: ({ id, body }) => ({
        url: `/customers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),

    approveCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/customers/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Customers"],
    }),

    rejectCustomer: builder.mutation<
      Customer,
      { id: string; rejectReason: string }
    >({
      query: ({ id, rejectReason }) => ({
        url: `/customers/${id}/reject`,
        method: "PATCH",
        body: {
          rejectReason,
        },
      }),
      invalidatesTags: ["Customers"],
    }),

    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomersPageQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useApproveCustomerMutation,
  useRejectCustomerMutation,
  useDeleteCustomerMutation,
  useGetMyCustomersQuery,
  useGetMyCustomersPageQuery,
} = customerService;
