export type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ConnectionEdge<T> = {
  cursor: string;
  node: T;
};

export type ConnectionPage<T> = {
  nodes: T[];
  edges: ConnectionEdge<T>[];
  pageInfo: PageInfo;
};

export type GraphQLRequest<TVariables extends Record<string, unknown>> = {
  query: string;
  variables: TVariables;
};

export type GraphQLError = {
  message: string;
};

export type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};
