import { PaginationQueryDto } from '../dto/pagination-query.dto';

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function shouldPaginate(query?: PaginationQueryDto): boolean {
  return Boolean(query?.page || query?.limit);
}

export function getPagination(query?: PaginationQueryDto) {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function getSort(query?: PaginationQueryDto): Record<string, 1 | -1> {
  return {
    [query?.sortBy || 'createdAt']: query?.sortOrder === 'asc' ? 1 : -1,
  };
}

export function buildSearchRegex(search: string): RegExp {
  return new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
