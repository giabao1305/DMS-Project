import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type { AdminDashboard, SellerDashboard } from "./dashboardTypes";

export const dashboardService = createApi({
  reducerPath: "dashboardService",
  baseQuery,
  tagTypes: ["Dashboard"],

  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => "/dashboard/admin",
      providesTags: ["Dashboard"],
    }),

    getSellerDashboard: builder.query<SellerDashboard, void>({
      query: () => "/dashboard/seller",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetAdminDashboardQuery, useGetSellerDashboardQuery } =
  dashboardService;
