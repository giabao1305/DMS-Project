import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import {
  buildQueryString,
  normalizePaginatedResponse,
  type PaginatedResponse,
  type PaginationQuery,
} from "@/features/paginationTypes";
import type {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from "./productTypes";

type ProductsResponse = {
  data?: Product[] | Product;
  product?: Product;
  products?: Product[];
  item?: Product;
};

const normalizeProducts = (response: unknown): Product[] => {
  if (Array.isArray(response)) return response as Product[];

  const data = response as ProductsResponse;

  if (!data || Array.isArray(data)) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.products)) return data.products;

  return [];
};

const normalizeProduct = (response: unknown): Product | undefined => {
  if (!response || Array.isArray(response)) return undefined;

  const data = response as ProductsResponse;

  if ("_id" in data) return data as Product;
  if (data.product) return data.product;
  if (data.item) return data.item;
  if (data.data && !Array.isArray(data.data)) return data.data;

  return undefined;
};

export const productService = createApi({
  reducerPath: "productService",
  baseQuery,
  tagTypes: ["Products"],

  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      transformResponse: normalizeProducts,
      providesTags: ["Products"],
    }),

    getProductsPage: builder.query<
      PaginatedResponse<Product>,
      PaginationQuery
    >({
      query: (query) => `/products${buildQueryString(query)}`,
      transformResponse: (response: unknown, _meta, query) =>
        normalizePaginatedResponse<Product>(response, query?.limit),
      providesTags: ["Products"],
    }),

    getProductById: builder.query<Product, string>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        const detailResult = await fetchWithBQ(`/products/${id}`);

        if (!detailResult.error) {
          const product = normalizeProduct(detailResult.data);

          if (product) {
            return {
              data: product,
            };
          }
        }

        const listResult = await fetchWithBQ("/products");

        if (listResult.error) {
          return {
            error: detailResult.error || listResult.error,
          };
        }

        const product = normalizeProducts(listResult.data).find(
          (item) => item._id === id,
        );

        if (product) {
          return {
            data: product,
          };
        }

        return {
          error: {
            status: 404,
            data: "Product not found",
          },
        };
      },
      providesTags: ["Products"],
    }),

    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    updateProduct: builder.mutation<
      Product,
      { id: string; body: UpdateProductRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),

    toggleProductStatus: builder.mutation<Product, string>({
      query: (id) => ({
        url: `/products/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["Products"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductsPageQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductStatusMutation,
} = productService;
