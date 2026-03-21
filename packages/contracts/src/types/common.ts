export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiError = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
};

export type ErrorResponse = {
  error: ApiError;
  meta: {
    requestId: string;
    path: string;
    timestamp: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
