import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type { PaginatedResponse, PaginationQuery } from "@/features/paginationTypes";
import {
  buildQueryString,
  normalizePaginatedResponse,
} from "@/features/paginationTypes";
import type {
  CreateLeaveRequest,
  LeaveRequest,
  RejectLeaveRequest,
} from "./leaveTypes";

export const leaveService = createApi({
  reducerPath: "leaveService",
  baseQuery,
  tagTypes: ["Leaves"],

  endpoints: (builder) => ({
    getLeaves: builder.query<LeaveRequest[], void>({
      query: () => "/leaves",
      providesTags: ["Leaves"],
    }),

    getLeavesPage: builder.query<PaginatedResponse<LeaveRequest>, PaginationQuery | void>({
      query: (params) => `/leaves${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<LeaveRequest>(response, arg?.limit),
      providesTags: ["Leaves"],
    }),

    getMyLeaves: builder.query<LeaveRequest[], void>({
      query: () => "/leaves/my-leaves",
      providesTags: ["Leaves"],
    }),

    getMyLeavesPage: builder.query<
      PaginatedResponse<LeaveRequest>,
      PaginationQuery | void
    >({
      query: (params) =>
        `/leaves/my-leaves${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<LeaveRequest>(response, arg?.limit),
      providesTags: ["Leaves"],
    }),

    getLeaveById: builder.query<LeaveRequest, string>({
      query: (id) => `/leaves/${id}`,
      providesTags: ["Leaves"],
    }),

    createLeave: builder.mutation<LeaveRequest, CreateLeaveRequest>({
      query: (body) => ({
        url: "/leaves",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leaves"],
    }),

    approveLeave: builder.mutation<LeaveRequest, string>({
      query: (id) => ({
        url: `/leaves/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Leaves"],
    }),

    rejectLeave: builder.mutation<
      LeaveRequest,
      {
        id: string;
        body: RejectLeaveRequest;
      }
    >({
      query: ({ id, body }) => ({
        url: `/leaves/${id}/reject`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Leaves"],
    }),
  }),
});

export const {
  useGetLeavesQuery,
  useGetLeavesPageQuery,
  useGetMyLeavesQuery,
  useGetMyLeavesPageQuery,
  useGetLeaveByIdQuery,
  useCreateLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} = leaveService;
