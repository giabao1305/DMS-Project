export type SortOrder = "asc" | "desc";

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  status?: string;
  module?: string;
  fromDate?: string;
  toDate?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const buildQueryString = (query?: PaginationQuery) => {
  if (!query) return "";

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
};

export const normalizePaginatedResponse = <T>(
  response: unknown,
  fallbackLimit = 10,
): PaginatedResponse<T> => {
  if (Array.isArray(response)) {
    return {
      data: response as T[],
      meta: {
        page: 1,
        limit: fallbackLimit,
        total: response.length,
        totalPages: Math.ceil(response.length / fallbackLimit),
      },
    };
  }

  const data = response as Partial<PaginatedResponse<T>> | undefined;
  const items = Array.isArray(data?.data) ? data.data : [];

  return {
    data: items,
    meta: {
      page: data?.meta?.page ?? 1,
      limit: data?.meta?.limit ?? fallbackLimit,
      total: data?.meta?.total ?? items.length,
      totalPages:
        data?.meta?.totalPages ?? Math.ceil(items.length / fallbackLimit),
    },
  };
};
