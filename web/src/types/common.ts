/** ISO 8601 datetime string */
export type ISODateString = string;

/** UUID v4 string */
export type UUID = string;

// ─── API envelopes ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
