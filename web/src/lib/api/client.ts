import axios, { type InternalAxiosRequestConfig } from "axios";
import { normalizeApiError } from "./error";
import { getApiAccessToken, setApiAccessToken } from "./token";

type UnauthorizedHandler = () => void;
type TokenRefresher = () => Promise<string | null>;

let onUnauthorizedHandler: UnauthorizedHandler | null = null;
let tokenRefresher: TokenRefresher | null = null;
let pendingRefresh: Promise<string | null> | null = null;

export function setOnUnauthorized(handler: UnauthorizedHandler) {
  onUnauthorizedHandler = handler;
}

export function setTokenRefresher(fn: TokenRefresher | null) {
  tokenRefresher = fn;
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getApiAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = normalizeApiError(error);
    const config = (error as { config?: RetryConfig }).config;

    if (apiError.status === 401 && tokenRefresher && config && !config._retry) {
      config._retry = true;
      try {
        // Deduplicate concurrent 401s — only one refresh call in flight at a time.
        if (!pendingRefresh) {
          pendingRefresh = tokenRefresher().finally(() => {
            pendingRefresh = null;
          });
        }
        const newToken = await pendingRefresh;
        if (newToken) {
          setApiAccessToken(newToken);
          config.headers.set("Authorization", `Bearer ${newToken}`);
          return apiClient(config);
        }
      } catch {
        // Refresh threw — fall through to logout below.
      }
      onUnauthorizedHandler?.();
      return Promise.reject(apiError);
    }

    if (apiError.status === 401) {
      onUnauthorizedHandler?.();
    }
    return Promise.reject(apiError);
  }
);
