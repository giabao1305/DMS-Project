import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import type {
  CreatePromotionRequest,
  Promotion,
  UpdatePromotionRequest,
} from "./promotionTypes";

export const promotionService = createApi({
  reducerPath: "promotionService",
  baseQuery,
  tagTypes: ["Promotions"],

  endpoints: (builder) => ({
    getPromotions: builder.query<Promotion[], void>({
      query: () => "/promotions",
      providesTags: ["Promotions"],
    }),

    getActivePromotions: builder.query<Promotion[], void>({
      query: () => "/promotions/active",
      providesTags: ["Promotions"],
    }),

    getPromotionById: builder.query<Promotion, string>({
      query: (id) => `/promotions/${id}`,
      providesTags: ["Promotions"],
    }),

    createPromotion: builder.mutation<Promotion, CreatePromotionRequest>({
      query: (body) => ({
        url: "/promotions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Promotions"],
    }),

    updatePromotion: builder.mutation<
      Promotion,
      { id: string; body: UpdatePromotionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/promotions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Promotions"],
    }),

    deletePromotion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/promotions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Promotions"],
    }),
  }),
});

export const {
  useGetPromotionsQuery,
  useGetActivePromotionsQuery,
  useGetPromotionByIdQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} = promotionService;
