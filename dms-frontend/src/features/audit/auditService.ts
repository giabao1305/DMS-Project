import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "@/features/baseApi";
import {
  buildQueryString,
  normalizePaginatedResponse,
  type PaginatedResponse,
  type PaginationQuery,
} from "@/features/paginationTypes";
import type { AuditLog } from "./auditTypes";

type AuditLogsResponse =
  | AuditLog[]
  | {
      data?: AuditLog[];
      logs?: AuditLog[];
      auditLogs?: AuditLog[];
      items?: AuditLog[];
    };

const normalizeAuditLogs = (response: unknown): AuditLog[] => {
  if (Array.isArray(response)) return response as AuditLog[];

  const data = response as AuditLogsResponse;

  if (!data || Array.isArray(data)) return [];

  return data.data || data.logs || data.auditLogs || data.items || [];
};

export const auditService = createApi({
  reducerPath: "auditService",
  baseQuery,
  tagTypes: ["AuditLogs"],

  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLog[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const endpoints = ["/audit-logs", "/audit/logs", "/audit", "/auditlogs"];
        let lastError;

        for (const url of endpoints) {
          const result = await fetchWithBQ(url);

          if (!result.error) {
            return {
              data: normalizeAuditLogs(result.data),
            };
          }

          lastError = result.error;
        }

        return {
          error:
            lastError || {
              status: "CUSTOM_ERROR",
              error: "Audit logs endpoint not found",
            },
        };
      },
      providesTags: ["AuditLogs"],
    }),

    getAuditLogsPage: builder.query<
      PaginatedResponse<AuditLog>,
      PaginationQuery
    >({
      query: (query) => `/audit-logs${buildQueryString(query)}`,
      transformResponse: (response: unknown, _meta, query) =>
        normalizePaginatedResponse<AuditLog>(response, query?.limit),
      providesTags: ["AuditLogs"],
    }),
  }),
});

export const { useGetAuditLogsQuery, useGetAuditLogsPageQuery } = auditService;
