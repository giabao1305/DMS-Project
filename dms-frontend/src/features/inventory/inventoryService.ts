import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import { productService } from "@/features/products/productService";
import type {
  AdjustStockRequest,
  ExportStockRequest,
  ImportStockRequest,
  InventoryTransaction,
} from "./inventoryTypes";

export const inventoryService = createApi({
  reducerPath: "inventoryService",
  baseQuery,
  tagTypes: ["Inventory"],

  endpoints: (builder) => ({
    importStock: builder.mutation<InventoryTransaction, ImportStockRequest>({
      query: (body) => ({
        url: "/inventory/import",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(productService.util.invalidateTags(["Products"]));
      },
    }),

    exportStock: builder.mutation<InventoryTransaction, ExportStockRequest>({
      query: (body) => ({
        url: "/inventory/export",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(productService.util.invalidateTags(["Products"]));
      },
    }),

    adjustStock: builder.mutation<InventoryTransaction, AdjustStockRequest>({
      query: (body) => ({
        url: "/inventory/adjust",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(productService.util.invalidateTags(["Products"]));
      },
    }),

    getInventoryTransactions: builder.query<InventoryTransaction[], void>({
      query: () => "/inventory/transactions",
      providesTags: ["Inventory"],
    }),

    getInventoryTransactionsByProduct: builder.query<
      InventoryTransaction[],
      string
    >({
      query: (productId) => `/inventory/product/${productId}`,
      providesTags: ["Inventory"],
    }),
  }),
});

export const {
  useImportStockMutation,
  useExportStockMutation,
  useAdjustStockMutation,
  useGetInventoryTransactionsQuery,
  useGetInventoryTransactionsByProductQuery,
} = inventoryService;
