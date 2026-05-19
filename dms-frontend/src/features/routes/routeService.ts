import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type { PaginatedResponse, PaginationQuery } from "@/features/paginationTypes";
import {
  buildQueryString,
  normalizePaginatedResponse,
} from "@/features/paginationTypes";
import type {
  CreateRouteRequest,
  Route,
  UpdateRouteRequest,
  UpdateRouteStatusRequest,
} from "./routeTypes";

export const routeService = createApi({
  reducerPath: "routeService",
  baseQuery,
  tagTypes: ["Routes"],

  endpoints: (builder) => ({
    getRoutes: builder.query<Route[], void>({
      query: () => "/routes",
      providesTags: ["Routes"],
    }),

    getRoutesPage: builder.query<PaginatedResponse<Route>, PaginationQuery | void>({
      query: (params) => `/routes${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<Route>(response, arg?.limit),
      providesTags: ["Routes"],
    }),

    getMyRoutes: builder.query<Route[], void>({
      query: () => "/routes/my-routes",
      providesTags: ["Routes"],
    }),

    getMyRoutesPage: builder.query<
      PaginatedResponse<Route>,
      PaginationQuery | void
    >({
      query: (params) =>
        `/routes/my-routes${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<Route>(response, arg?.limit),
      providesTags: ["Routes"],
    }),

    getTodayRoute: builder.query<Route[], void>({
      query: () => "/routes/today",
      providesTags: ["Routes"],
    }),

    getRouteById: builder.query<Route, string>({
      query: (id) => `/routes/${id}`,
      providesTags: ["Routes"],
    }),

    createRoute: builder.mutation<Route, CreateRouteRequest>({
      query: (body) => ({
        url: "/routes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Routes"],
    }),

    updateRoute: builder.mutation<
      Route,
      { id: string; body: UpdateRouteRequest }
    >({
      query: ({ id, body }) => ({
        url: `/routes/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Routes"],
    }),

    updateRouteStatus: builder.mutation<
      Route,
      { id: string; body: UpdateRouteStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/routes/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Routes"],
    }),

    deleteRoute: builder.mutation<void, string>({
      query: (id) => ({
        url: `/routes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Routes"],
    }),
  }),
});

export const {
  useGetRoutesQuery,
  useGetRoutesPageQuery,
  useGetMyRoutesQuery,
  useGetMyRoutesPageQuery,
  useGetTodayRouteQuery,
  useGetRouteByIdQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useUpdateRouteStatusMutation,
  useDeleteRouteMutation,
} = routeService;
