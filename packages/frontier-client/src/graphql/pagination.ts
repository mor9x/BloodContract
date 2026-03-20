import type { ConnectionEdge, ConnectionPage, PageInfo } from "../types/graphql";

export const EMPTY_PAGE_INFO: PageInfo = {
  hasNextPage: false,
  endCursor: null
};

export function toConnectionPage<T>(
  nodes: T[],
  pageInfo: PageInfo = EMPTY_PAGE_INFO,
  edges: ConnectionEdge<T>[] = []
): ConnectionPage<T> {
  return { nodes, edges, pageInfo };
}

export function nextCursor(page: ConnectionPage<unknown>): string | null {
  return page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
}
