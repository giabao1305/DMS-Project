import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type {
  CreateKpiRequest,
  Kpi,
  OrdersReportItem,
  SalesReportItem,
  SellersReportItem,
  UpdateKpiRequest,
  VisitsReportItem,
} from "./reportTypes";

type ReportQuery = {
  month?: number;
  year?: number;
};

const buildQuery = (url: string, params?: ReportQuery) => {
  const searchParams = new URLSearchParams();

  if (params?.month) {
    searchParams.set("month", String(params.month));
  }

  if (params?.year) {
    searchParams.set("year", String(params.year));
  }

  const queryString = searchParams.toString();

  return queryString ? `${url}?${queryString}` : url;
};

export const reportService = createApi({
  reducerPath: "reportService",
  baseQuery,
  tagTypes: ["Reports"],

  endpoints: (builder) => ({
    createKpi: builder.mutation<Kpi, CreateKpiRequest>({
      query: (body) => ({
        url: "/reports/kpis",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reports"],
    }),
    updateKpi: builder.mutation<Kpi, { id: string; body: UpdateKpiRequest }>({
      query: ({ id, body }) => ({
        url: `/reports/kpis/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Reports"],
    }),
    getSalesReport: builder.query<SalesReportItem[], ReportQuery | void>({
      query: (params) => buildQuery("/reports/sales", params || undefined),
      providesTags: ["Reports"],
    }),

    getOrdersReport: builder.query<OrdersReportItem[], ReportQuery | void>({
      query: (params) => buildQuery("/reports/orders", params || undefined),
      providesTags: ["Reports"],
    }),

    getVisitsReport: builder.query<VisitsReportItem[], ReportQuery | void>({
      query: (params) => buildQuery("/reports/visits", params || undefined),
      providesTags: ["Reports"],
    }),

    getSellersReport: builder.query<SellersReportItem[], ReportQuery | void>({
      query: (params) => buildQuery("/reports/sellers", params || undefined),
      providesTags: ["Reports"],
    }),

    getKpis: builder.query<Kpi[], void>({
      query: () => "/reports/kpis",
      providesTags: ["Reports"],
    }),
    getMyKpis: builder.query<Kpi[], void>({
      query: () => "/reports/kpis/my-kpi",
      providesTags: ["Reports"],
    }),
    refreshKpi: builder.mutation<Kpi, string>({
      query: (id) => ({
        url: `/reports/kpis/${id}/refresh`,
        method: "PATCH",
      }),
      invalidatesTags: ["Reports"],
    }),
  }),
});

export const {
  useCreateKpiMutation,
  useGetMyKpisQuery,
  useGetSalesReportQuery,
  useGetOrdersReportQuery,
  useGetVisitsReportQuery,
  useGetSellersReportQuery,
  useGetKpisQuery,
  useUpdateKpiMutation,
  useRefreshKpiMutation,
} = reportService;
