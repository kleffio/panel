import axios from "axios";
import { normalizeApiError } from "./error";
import { getApiAccessToken } from "./token";

// Use relative paths so browser requests go through the Next.js rewrite proxy
// (/api/* → http://api:8080/api/*). The full API base URL is only needed in
// next.config.ts for the server-side rewrite rule.
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
  (error: unknown) => Promise.reject(normalizeApiError(error))
);
