export const ITEMS_PER_PAGE = 2;
export const COLLECTIONS_PER_PAGE = 2;

export const DASHBOARD_COLLECTIONS_LIMIT = 2;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 2;

export function parsePageParam(pageParam: string | string[] | undefined): number {
  const pageValue = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsed = Number.parseInt(pageValue ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function getPageOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}