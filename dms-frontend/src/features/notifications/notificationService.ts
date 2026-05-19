import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type { PaginatedResponse, PaginationQuery } from "@/features/paginationTypes";
import {
  buildQueryString,
  normalizePaginatedResponse,
} from "@/features/paginationTypes";

import type { Notification } from "./notificationTypes";

export const notificationService = createApi({
  reducerPath: "notificationService",
  baseQuery,
  tagTypes: ["Notifications"],

  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    getNotificationsPage: builder.query<
      PaginatedResponse<Notification>,
      PaginationQuery | void
    >({
      query: (params) =>
        `/notifications${buildQueryString(params || undefined)}`,
      transformResponse: (response: unknown, _meta, arg) =>
        normalizePaginatedResponse<Notification>(response, arg?.limit),
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query<{ unreadCount: number }, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationsPageQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationService;
