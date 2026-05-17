/**
 * apiClient.js
 * -----------
 * Centralized Axios instance for all API calls.
 * Base URL is read from .env (VITE_API_BASE_URL).
 * Simple password-based auth — no JWT Bearer token attached.
 */

import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds — AI calls can be slow
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// When sending FormData (file uploads), let axios set Content-Type automatically
// so it includes the multipart boundary.
apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;
