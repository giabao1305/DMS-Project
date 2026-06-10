import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type {
  CreateWarehouseRequest,
  InitializeWarehouseStockRequest,
  UpdateWarehouseSellingPriceRequest,
  UpdateWarehouseStatusRequest,
  Warehouse,
  WarehouseStock,
} from "./warehouseTypes";

export const warehouseService = createApi({
  reducerPath: "warehouseService",
  baseQuery,
  tagTypes: ["Warehouses", "WarehouseStocks"],

  endpoints: (builder) => ({
    getWarehouses: builder.query<Warehouse[], void>({
      query: () => "/warehouses",
      providesTags: ["Warehouses"],
    }),

    createWarehouse: builder.mutation<Warehouse, CreateWarehouseRequest>({
      query: (body) => ({
        url: "/warehouses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Warehouses"],
    }),

    getWarehouseStocks: builder.query<WarehouseStock[], string>({
      query: (warehouseId) => `/warehouses/${warehouseId}/stocks`,
      providesTags: (_result, _error, warehouseId) => [
        { type: "WarehouseStocks", id: warehouseId },
      ],
    }),

    getSellerWarehouseStocks: builder.query<WarehouseStock[], string>({
      query: (sellerId) => `/warehouses/seller/${sellerId}/stocks`,
      providesTags: (_result, _error, sellerId) => [
        { type: "WarehouseStocks", id: `seller-${sellerId}` },
      ],
    }),

    initializeWarehouseStock: builder.mutation<
      WarehouseStock,
      { warehouseId: string; body: InitializeWarehouseStockRequest }
    >({
      query: ({ warehouseId, body }) => ({
        url: `/warehouses/${warehouseId}/stocks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseStocks", id: warehouseId },
      ],
    }),

    updateWarehouseSellingPrice: builder.mutation<
      WarehouseStock,
      {
        warehouseId: string;
        stockId: string;
        body: UpdateWarehouseSellingPriceRequest;
      }
    >({
      query: ({ warehouseId, stockId, body }) => ({
        url: `/warehouses/${warehouseId}/stocks/${stockId}/selling-price`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseStocks", id: warehouseId },
      ],
    }),

    updateWarehouseStatus: builder.mutation<
      Warehouse,
      { warehouseId: string; body: UpdateWarehouseStatusRequest }
    >({
      query: ({ warehouseId, body }) => ({
        url: `/warehouses/${warehouseId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Warehouses"],
    }),
  }),
});

export const {
  useCreateWarehouseMutation,
  useGetWarehousesQuery,
  useGetWarehouseStocksQuery,
  useGetSellerWarehouseStocksQuery,
  useInitializeWarehouseStockMutation,
  useUpdateWarehouseSellingPriceMutation,
  useUpdateWarehouseStatusMutation,
} = warehouseService;
