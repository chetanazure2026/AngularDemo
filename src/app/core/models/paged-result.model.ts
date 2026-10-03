/** Mirrors `PagedResult<T>` from the API. */
export interface PagedResult<T> {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalRecords: number;
  readonly data: readonly T[];
}

export function totalPages(result: Pick<PagedResult<unknown>, 'pageSize' | 'totalRecords'>): number {
  return result.pageSize > 0 ? Math.ceil(result.totalRecords / result.pageSize) : 0;
}
