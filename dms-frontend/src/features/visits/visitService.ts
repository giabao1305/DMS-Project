import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type { PaginatedResponse, PaginationQuery } from "@/features/paginationTypes";
import {
  buildQueryString,
  normalizePaginatedResponse,
} from "@/features/paginationTypes";
import { routeService } from "@/features/routes/routeService";
import type { CheckInRequest, CheckOutRequest, Visit } from "./visitTypes";

export const visitService = createApi({
  reducerPath: "visitService",
  baseQuery,
  tagTypes: ["Visits"],

  endpoints: (builder) => ({
    getVisits: builder.query<Visit[], void>({
      query: () => "/visits",
      providesTags: ["Visits"],
    }),

    getVisitsPage: builder.query<PaginatedResponse<Visit>, PaginationQuery | void>({
      query: (params) => `/visits${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<Visit>(response, arg?.limit),
      providesTags: ["Visits"],
    }),

    getMyVisits: builder.query<Visit[], void>({
      query: () => "/visits/my-visits",
      providesTags: ["Visits"],
    }),

    getMyVisitsPage: builder.query<
      PaginatedResponse<Visit>,
      PaginationQuery | void
    >({
      query: (params) =>
        `/visits/my-visits${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<Visit>(response, arg?.limit),
      providesTags: ["Visits"],
    }),

    getVisitById: builder.query<Visit, string>({
      query: (id) => `/visits/${id}`,
      providesTags: ["Visits"],
    }),

    checkIn: builder.mutation<Visit, CheckInRequest>({
      query: (body) => ({
        url: "/visits/check-in",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Visits"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(routeService.util.invalidateTags(["Routes"]));
      },
    }),

    checkOut: builder.mutation<Visit, { id: string; body: CheckOutRequest }>({
      query: ({ id, body }) => ({
        url: `/visits/${id}/check-out`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Visits"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(routeService.util.invalidateTags(["Routes"]));
      },
    }),
  }),
});

export const {
  useGetVisitsQuery,
  useGetVisitsPageQuery,
  useGetMyVisitsQuery,
  useGetMyVisitsPageQuery,
  useGetVisitByIdQuery,
  useCheckInMutation,
  useCheckOutMutation,
} = visitService;
